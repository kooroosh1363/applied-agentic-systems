import test from 'node:test';import assert from 'node:assert/strict';import {readdir,readFile} from 'node:fs/promises';
const directory=new URL('../workflows/',import.meta.url);const files=(await readdir(directory)).filter(x=>x.endsWith('.json')).sort();
test('five workflows are included',()=>assert.equal(files.length,5));
for(const file of files)test(`${file} is importable and inactive`,async()=>{const workflow=JSON.parse(await readFile(new URL(file,directory),'utf8'));assert.equal(workflow.active,false);assert.ok(workflow.name.startsWith('P19'));assert.ok(Array.isArray(workflow.nodes)&&workflow.nodes.length>=2);assert.ok(workflow.connections&&typeof workflow.connections==='object');});
test('approval workflow has explicit human wait',async()=>{const workflow=JSON.parse(await readFile(new URL('intervention-policy-approval.json',directory),'utf8'));assert.ok(workflow.nodes.some(n=>n.type==='n8n-nodes-base.wait'));});
test('delivery workflow is explicitly mock named',async()=>{const workflow=JSON.parse(await readFile(new URL('mock-delivery-outcome.json',directory),'utf8'));assert.match(workflow.name,/Mock/);});
