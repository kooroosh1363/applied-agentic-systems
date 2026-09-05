import test from 'node:test';import assert from 'node:assert/strict';import {readdir,readFile} from 'node:fs/promises';
const dir=new URL('../workflows/',import.meta.url),files=(await readdir(dir)).filter(x=>x.endsWith('.json')).sort();
test('five workflows ship',()=>assert.equal(files.length,5));
for(const file of files)test(`${file} is importable and inactive`,async()=>{const w=JSON.parse(await readFile(new URL(file,dir),'utf8'));assert.equal(w.active,false);assert.ok(w.name.startsWith('P20'));assert.ok(w.nodes.length>=2);assert.ok(w.connections&&typeof w.connections==='object');});
test('approval workflow waits for humans',async()=>assert.ok(JSON.parse(await readFile(new URL('budget-multi-role-approval.json',dir),'utf8')).nodes.some(n=>n.type==='n8n-nodes-base.wait')));
test('handoff workflow names both prior projects',async()=>{const s=await readFile(new URL('project09-project10-handoffs.json',dir),'utf8');assert.match(s,/Project 09/);assert.match(s,/Project 10/);});
test('no workflow is active',async()=>{for(const f of files)assert.equal(JSON.parse(await readFile(new URL(f,dir),'utf8')).active,false);});
