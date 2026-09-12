import { randomBytes } from 'node:crypto';
import { ControlPlane } from './control-plane.mjs';
const credentials = ['author', 'reviewer', 'operator', 'worker'].map(role => ({
  token: randomBytes(32).toString('hex'), tenant: 'demo', actor: role, roles: [role, 'viewer']
}));
const p = new ControlPlane({ credentials });
const tokens = Object.fromEntries(credentials.map(c => [c.actor, c.token]));
let generation = 0;
const command = (role, action, extra = {}) => {
  const result = p.command(tokens[role], { action, workflow: 'triage', expectedGeneration: generation, ...extra });
  generation = result.generation; return result;
};
command('author', 'propose', { config: { adapter: 'local-classifier-v1', concurrency: 2 } });
command('reviewer', 'approve', { revision: 1 });
command('operator', 'activate', { revision: 1 });
command('operator', 'resume');
const digest = p.read(tokens.author, 'triage').revisions[0].digest;
command('worker', 'acknowledge', { digest, health: 'healthy' });
const resolved = p.resolve(tokens.worker, 'triage');
command('operator', 'pause');
let pauseResult;
try { p.resolve(tokens.worker, 'triage'); } catch (e) { pauseResult = e.code; }
console.log(JSON.stringify({ resolved, pauseResult, audit: p.audit(tokens.author) }, null, 2));
