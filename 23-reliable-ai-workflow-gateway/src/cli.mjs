import { randomBytes } from 'node:crypto';
import { Gateway, localClassifier } from './gateway.mjs';
const token = randomBytes(32).toString('hex');
const gateway = new Gateway({ credentials: [{ token, tenant: 'demo', workflows: ['classify-v1'] }], adapter: localClassifier });
const request = { workflow: 'classify-v1', key: 'demo-0001', text: 'Please help with my order' };
const first = await gateway.execute(token, request);
const replay = await gateway.execute(token, request);
console.log(JSON.stringify({ ...first, sameExecution: first.id === replay.id, auditRecords: gateway.audit.length }, null, 2));
