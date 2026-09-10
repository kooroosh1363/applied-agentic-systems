import test from 'node:test';
import assert from 'node:assert/strict';
import { Gateway, GatewayError, localClassifier } from '../src/gateway.mjs';
import { buildServer } from '../src/server.mjs';
const token = 'a'.repeat(40), second = 'b'.repeat(40);
const request = (key = 'request-01') => ({ key, workflow: 'classify-v1', text: 'help' });
const setup = options => new Gateway({ credentials: [
  { token, tenant: 'alpha', workflows: ['classify-v1'] },
  { token: second, tenant: 'beta', workflows: ['classify-v1'] }
], adapter: localClassifier, ...options });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('requires a strong configured credential', () => assert.throws(() => new Gateway({ credentials: [{ token: 'weak', tenant: 'a', workflows: [] }], adapter: localClassifier })));
test('rejects unknown credentials', async () => assert.rejects(setup().execute('bad', request()), { code: 'unauthorized' }));
for (const mutation of [null, [], {}, { ...request(), tenant: 'victim' }, { ...request(), key: 'x' }, { ...request(), text: '' }, { ...request(), text: 'x'.repeat(8193) }]) {
  test(`invalid input ${JSON.stringify(mutation)?.slice(0,65)}`, async () => assert.rejects(setup().execute(token, mutation), { code: 'invalid_request' }));
}
test('workflow allowlist prevents URL injection', async () => assert.rejects(setup().execute(token, { ...request(), workflow: 'http://internal' }), { code: 'workflow_forbidden' }));
test('same key coalesces simultaneous executions', async () => {
  const wait = deferred(); let calls = 0;
  const g = setup({ adapter: async () => { calls++; await wait.promise; return { label: 'support' }; } });
  const a = g.execute(token, request()), b = g.execute(token, request());
  wait.resolve(); assert.deepEqual(await a, await b); assert.equal(calls, 1); assert.equal(g.audit.length, 1);
});
test('key is bound to payload', async () => {
  const g = setup(); await g.execute(token, request());
  await assert.rejects(g.execute(token, { ...request(), text: 'buy' }), { code: 'idempotency_conflict' });
});
test('mutating returned result does not poison replay', async () => {
  const g = setup(); const result = await g.execute(token, request()); result.result.label = 'sales';
  assert.equal((await g.execute(token, request())).result.label, 'support');
});
test('same key is independent across tenants', async () => {
  const g = setup(); assert.notEqual((await g.execute(token, request())).id, (await g.execute(second, request())).id);
});
test('rate limit is per tenant and replay does not consume it', async () => {
  let now = 0; const g = setup({ perMinute: 1, clock: () => now });
  await g.execute(token, request()); await g.execute(token, request());
  await assert.rejects(g.execute(token, request('request-02')), { code: 'rate_limit' });
  await g.execute(second, request()); now = 60000; await g.execute(token, request('request-02'));
});
test('concurrency gate rejects excess work', async () => {
  const wait = deferred(); const g = setup({ maxConcurrent: 1, adapter: async () => { await wait.promise; return { label: 'other' }; } });
  const a = g.execute(token, request());
  await assert.rejects(g.execute(token, request('request-02')), { code: 'concurrency_limit' }); wait.resolve(); await a;
});
test('timeout stays unknown and retains slot until actual settlement', async () => {
  const wait = deferred(); const g = setup({ timeoutMs: 10, maxConcurrent: 1, adapter: async () => { await wait.promise; return { label: 'other' }; } });
  const result = await g.execute(token, request()); assert.equal(result.status, 'unknown');
  assert.deepEqual(await g.execute(token, request()), result);
  await assert.rejects(g.execute(token, request('request-02')), { code: 'concurrency_limit' });
  wait.resolve(); await new Promise(r => setImmediate(r)); assert.equal(g.active.get('alpha'), 0);
  assert.equal((await g.execute(token, request())).status, 'unknown');
});
test('only explicit pre-execution busy is retried', async () => {
  let calls = 0; const g = setup({ adapter: async () => { if (++calls === 1) throw new GatewayError('busy_before_execution'); return { label: 'other' }; } });
  assert.equal((await g.execute(token, request())).attempts, 2);
});
test('unknown adapter error is never retried or leaked', async () => {
  let calls = 0; const g = setup({ adapter: async () => { calls++; throw new Error('sensitive provider detail'); } });
  assert.equal((await g.execute(token, request())).code, 'adapter_failed'); assert.equal(calls, 1);
  assert.ok(!JSON.stringify(g.audit).includes('sensitive'));
});
test('retry exhaustion is bounded', async () => {
  let calls = 0; const g = setup({ adapter: async () => { calls++; throw new GatewayError('busy_before_execution'); } });
  assert.equal((await g.execute(token, request())).code, 'retry_exhausted'); assert.equal(calls, 2);
});
for (const output of [null, { label: 'made-up' }, { label: 'support', extra: 'unsafe' }])
  test(`invalid output ${JSON.stringify(output)}`, async () => assert.equal((await setup({ adapter: async () => output }).execute(token, request())).code, 'invalid_output'));
test('circuit opens, admits one recovery probe, then closes', async () => {
  let now = 0, healthy = false; const wait = deferred();
  const g = setup({ failureThreshold: 1, cooldownMs: 10, clock: () => now, adapter: async () => {
    if (!healthy) throw Error('down'); await wait.promise; return { label: 'other' };
  } });
  await g.execute(token, request()); await assert.rejects(g.execute(token, request('request-02')), { code: 'circuit_open' });
  now = 10; healthy = true; const probe = g.execute(token, request('request-02'));
  await assert.rejects(g.execute(token, request('request-03')), { code: 'circuit_open' });
  wait.resolve(); await probe; assert.equal((await g.execute(token, request('request-03'))).status, 'succeeded');
});
test('capacity fails closed rather than forgetting idempotency', async () => {
  const g = setup({ maxRecords: 1 }); await g.execute(token, request());
  await assert.rejects(g.execute(token, request('request-02')), { code: 'capacity_exhausted' });
  assert.equal((await g.execute(token, request())).status, 'succeeded');
});
test('HTTP validates auth, JSON, body limit and successful execution', async t => {
  const server = buildServer(setup()); await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const url = `http://127.0.0.1:${server.address().port}/v1/execute`;
  assert.equal((await fetch(url, { method: 'POST' })).status, 401);
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  assert.equal((await fetch(url, { method: 'POST', headers, body: '{' })).status, 400);
  assert.equal((await fetch(url, { method: 'POST', headers, body: 'x'.repeat(17000) })).status, 413);
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(request()) });
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).result.label, 'support');
});
