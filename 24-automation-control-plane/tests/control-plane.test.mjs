import test from 'node:test';
import assert from 'node:assert/strict';
import { ControlPlane } from '../src/control-plane.mjs';
import { buildServer } from '../src/server.mjs';
const names = ['author', 'reviewer', 'operator', 'worker', 'viewer'];
const tokens = Object.fromEntries(names.map((r, i) => [r, String(i + 1).repeat(40)]));
const creds = names.map(r => ({ token: tokens[r], tenant: 'alpha', actor: r, roles: [r, 'viewer'] }));
const config = { adapter: 'local-classifier-v1', concurrency: 2 };
function setup(options = {}) {
  const p = new ControlPlane({ credentials: creds, ...options });
  const state = () => p.read(tokens.viewer, 'triage');
  const cmd = (role, action, extra = {}, generation) => {
    let g = 0; try { g = state().generation; } catch {}
    return p.command(tokens[role], { action, workflow: 'triage', expectedGeneration: generation ?? g, ...extra });
  };
  const propose = () => cmd('author', 'propose', { config });
  const ready = () => {
    propose(); cmd('reviewer', 'approve', { revision: 1 }); cmd('operator', 'activate', { revision: 1 });
    cmd('operator', 'resume'); cmd('worker', 'acknowledge', { digest: state().revisions[0].digest, health: 'healthy' });
  };
  return { p, state, cmd, propose, ready };
}
const rejects = (fn, code) => assert.throws(fn, { code });
test('invalid and duplicate credentials fail startup', () => {
  assert.throws(() => new ControlPlane());
  assert.throws(() => setup({ credentials: [{ ...creds[0], token: 'short' }] }));
  assert.throws(() => setup({ credentials: [creds[0], creds[0]] }));
});
test('unknown credential is rejected before command parsing', () => rejects(() => setup().p.command('bad', null), 'unauthorized'));
for (const body of [null, [], {}, { action: 'toString' }, { action: 'pause', workflow: 'triage', expectedGeneration: 0, tenant: 'beta' }])
  test(`rejects malformed command ${JSON.stringify(body)}`, () => rejects(() => setup().p.command(tokens.author, body), 'invalid_command'));
for (const value of [{ ...config, url: 'http://internal' }, { ...config, concurrency: 0 }, { ...config, concurrency: 11 }, { ...config, concurrency: 1.5 }, { ...config, adapter: 'unknown' }])
  test(`rejects unsafe configuration ${JSON.stringify(value)}`, () => rejects(() => setup().cmd('author', 'propose', { config: value }), 'invalid_config'));
test('viewer cannot mutate and worker cannot approve', () => {
  const x = setup(); x.propose();
  rejects(() => x.cmd('viewer', 'pause'), 'forbidden');
  rejects(() => x.cmd('worker', 'approve', { revision: 1 }), 'forbidden');
});
test('author cannot approve using another credential for same identity', () => {
  const x = setup({ credentials: creds.map(c => c.actor === 'reviewer' ? { ...c, actor: 'author' } : c) });
  x.propose(); rejects(() => x.cmd('reviewer', 'approve', { revision: 1 }), 'self_approval');
});
test('cross-tenant read, mutation and audit are isolated', () => {
  const outsider = 'z'.repeat(40);
  const x = setup({ credentials: [...creds, { token: outsider, tenant: 'beta', actor: 'operator', roles: ['viewer', 'operator'] }] });
  x.propose(); rejects(() => x.p.read(outsider, 'triage'), 'not_found');
  rejects(() => x.p.command(outsider, { action: 'pause', workflow: 'triage', expectedGeneration: 1 }), 'not_found');
  assert.deepEqual(x.p.audit(outsider), []);
});
test('state, credentials and audit reads cannot mutate private state', () => {
  const x = setup(); x.propose();
  x.state().revisions[0].config.concurrency = 9;
  x.p.authenticate(tokens.viewer).roles.push('operator');
  x.p.audit(tokens.viewer)[0].action = 'tampered';
  assert.equal(x.state().revisions[0].config.concurrency, 2);
  assert.equal(x.p.audit(tokens.viewer)[0].action, 'propose');
  rejects(() => x.cmd('viewer', 'pause'), 'forbidden');
});
test('activation requires approval and preserves pause', () => {
  const x = setup(); x.propose(); rejects(() => x.cmd('operator', 'activate', { revision: 1 }), 'approval_required');
  x.cmd('reviewer', 'approve', { revision: 1 }); x.cmd('operator', 'activate', { revision: 1 });
  assert.equal(x.state().paused, true);
});
test('same generation allows only one racing mutation and rejects retry', async () => {
  const x = setup(); x.propose();
  const results = await Promise.allSettled([1,2].map(() => Promise.resolve().then(() => x.cmd('operator', 'pause', {}, 1))));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(x.state().generation, 2); assert.equal(x.p.audit(tokens.viewer).length, 2);
});
test('desired state is not a worker acknowledgement', () => {
  const x = setup(); x.propose(); x.cmd('reviewer', 'approve', { revision: 1 });
  x.cmd('operator', 'activate', { revision: 1 }); x.cmd('operator', 'resume');
  rejects(() => x.p.resolve(tokens.worker, 'triage'), 'not_converged');
});
test('healthy acknowledgement resolves exact config with simulation markers', () => {
  const x = setup(); x.ready(); const r = x.p.resolve(tokens.worker, 'triage');
  assert.deepEqual(r.config, config); assert.equal(r.generation, x.state().generation);
  assert.equal(r.externalDeployment, false); assert.equal(r.evidence, 'local-simulation');
});
test('wrong digest and stale acknowledgement cannot change state', () => {
  const x = setup(); x.ready(); const before = x.state();
  rejects(() => x.cmd('worker', 'acknowledge', { digest: 'wrong', health: 'healthy' }), 'digest_mismatch');
  rejects(() => x.cmd('worker', 'acknowledge', { digest: before.observed.digest, health: 'healthy' }, 1), 'generation_conflict');
  assert.deepEqual(x.state(), before);
});
test('pause blocks immediately; resume requires a fresh acknowledgement', () => {
  const x = setup(); x.ready(); x.cmd('operator', 'pause');
  rejects(() => x.p.resolve(tokens.worker, 'triage'), 'paused');
  x.cmd('operator', 'resume'); rejects(() => x.p.resolve(tokens.worker, 'triage'), 'not_converged');
});
test('unhealthy acknowledgement prevents resolution', () => {
  const x = setup(); x.ready(); x.cmd('worker', 'acknowledge', { digest: x.state().observed.digest, health: 'unhealthy' });
  rejects(() => x.p.resolve(tokens.worker, 'triage'), 'not_converged');
});
test('freshness boundary and backwards clock fail closed', () => {
  let now = 100; const x = setup({ clock: () => now, freshnessMs: 10 }); x.ready();
  now = 109; x.p.resolve(tokens.worker, 'triage'); now = 110;
  rejects(() => x.p.resolve(tokens.worker, 'triage'), 'observation_stale'); now = 99;
  rejects(() => x.p.resolve(tokens.worker, 'triage'), 'observation_stale');
});
test('rollback requires prior activation and invalidates old observation', () => {
  const x = setup(); x.ready(); x.propose(); x.cmd('reviewer', 'approve', { revision: 2 });
  rejects(() => x.cmd('operator', 'rollback', { revision: 2 }), 'rollback_not_deployed');
  x.cmd('operator', 'activate', { revision: 2 }); x.cmd('operator', 'rollback', { revision: 1 });
  assert.equal(x.state().desired, 1); rejects(() => x.p.resolve(tokens.worker, 'triage'), 'not_converged');
});
test('new draft preserves approved revision but invalidates observation', () => {
  const x = setup(); x.ready(); const original = x.state().revisions[0]; x.propose();
  assert.deepEqual(x.state().revisions[0], original);
  rejects(() => x.p.resolve(tokens.worker, 'triage'), 'not_converged');
});
test('capacity failures do not partially mutate', () => {
  const x = setup({ maxRevisions: 1 }); x.propose(); const before = x.state();
  rejects(() => x.propose(), 'revision_capacity'); assert.deepEqual(x.state(), before);
  const y = setup({ maxChanges: 1 }); y.propose(); rejects(() => y.cmd('operator', 'pause'), 'audit_capacity');
  const z = setup({ maxWorkflows: 1 }); z.propose();
  rejects(() => z.p.command(tokens.author, { action: 'propose', workflow: 'second', expectedGeneration: 0, config }), 'workflow_capacity');
});
test('HTTP contract authenticates, bounds body and maps errors', async t => {
  const x = setup(), server = buildServer(x.p);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const url = `http://127.0.0.1:${server.address().port}/v1/commands`;
  const headers = { authorization: `Bearer ${tokens.author}`, 'content-type': 'application/json' };
  assert.equal((await fetch(url, { method: 'POST' })).status, 401);
  assert.equal((await fetch(url, { method: 'POST', headers, body: '{' })).status, 400);
  assert.equal((await fetch(url, { method: 'POST', headers, body: 'x'.repeat(9000) })).status, 413);
  const body = JSON.stringify({ action: 'propose', workflow: 'triage', expectedGeneration: 0, config });
  const r = await fetch(url, { method: 'POST', headers, body });
  assert.equal(r.status, 200); assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal((await r.json()).generation, 1);
  assert.equal((await fetch(url, { method: 'POST', headers, body })).status, 409);
});

test('audit exhaustion also fails closed for new resolution', () => {
  const x = setup({ maxChanges: 5 }); x.ready();
  rejects(() => x.p.resolve(tokens.worker, 'triage'), 'audit_capacity');
});
