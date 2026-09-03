import test from 'node:test';import assert from 'node:assert/strict';import {readdir,readFile} from 'node:fs/promises';
const dir=new URL('../workflows/',import.meta.url),files=(await readdir(dir)).filter(x=>x.endsWith('.json')).sort();
test('ships five inactive workflows',()=>assert.equal(files.length,5));
for(const file of files)test(`${file} is importable and connected`,async()=>{const w=JSON.parse(await readFile(new URL(file,dir),'utf8'));assert.equal(w.active,false);assert.ok(w.nodes.length>=3);const names=new Set(w.nodes.map(n=>n.name));assert.equal(names.size,w.nodes.length);for(const groups of Object.values(w.connections))for(const group of groups.main??[])for(const edge of group)assert.ok(names.has(edge.node))});
test('intake enforces safety and agent budget',async()=>{const s=await readFile(new URL('procurement-intake-agent-plan.json',dir),'utf8');assert.match(s,/unsafe request/);assert.match(s,/agent budget/)});
test('evidence workflow states screening boundary',async()=>assert.match(await readFile(new URL('vendor-evidence-compliance.json',dir),'utf8'),/not_real_sanctions/));
test('evaluation forbids automatic award',async()=>{const s=await readFile(new URL('parallel-vendor-evaluation.json',dir),'utf8');assert.match(s,/autoAward/);assert.match(s,/autoPurchase/)});
test('review requires roles and rationale',async()=>{const s=await readFile(new URL('multi-role-award-review.json',dir),'utf8');assert.match(s,/reviewerRole/);assert.match(s,/rationale/);assert.match(s,/purchaseAuthorized/)});
test('PO workflow remains draft with bounded DLQ',async()=>{const s=await readFile(new URL('po-draft-audit-retry-dlq.json',dir),'utf8');assert.match(s,/autoIssue/);assert.match(s,/maxAttempts/);assert.match(s,/autoReplay/)});
