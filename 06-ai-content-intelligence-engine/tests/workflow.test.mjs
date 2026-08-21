import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
const directory=new URL('../workflows/',import.meta.url);
const files=await readdir(directory);
test('all workflow exports parse and are inactive',async()=>{assert.equal(files.length,6);for(const file of files){const workflow=JSON.parse(await readFile(new URL(file,directory),'utf8'));assert.equal(workflow.active,false);assert.ok(workflow.nodes.length>=4);assert.ok(workflow.connections);}});
test('webhook workflows respond explicitly',async()=>{for(const file of files.filter(x=>!x.includes('retry'))){const workflow=JSON.parse(await readFile(new URL(file,directory),'utf8'));assert.ok(workflow.nodes.some(node=>node.type==='n8n-nodes-base.respondToWebhook'),file);}});
test('workflows include security evidence or state controls',async()=>{const text=(await Promise.all(files.map(file=>readFile(new URL(file,directory),'utf8')))).join('\n');for(const term of ['Idempotency','Evidence','Human','DLQ'])assert.match(text,new RegExp(term,'i'));});
