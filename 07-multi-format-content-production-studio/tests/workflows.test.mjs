import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
const dir=new URL('../workflows/',import.meta.url);const names=await readdir(dir);const flows=await Promise.all(names.map(async name=>[name,JSON.parse(await readFile(new URL(name,dir)))]));
for(const[name,w]of flows){test(`${name} is inactive and structurally connected`,()=>{assert.equal(w.active,false);assert.ok(w.nodes.length>=4);assert.equal(new Set(w.nodes.map(n=>n.name)).size,w.nodes.length);for(const from of Object.keys(w.connections))assert.ok(w.nodes.some(n=>n.name===from));for(const groups of Object.values(w.connections))for(const branch of groups.main??[])for(const edge of branch)assert.ok(w.nodes.some(n=>n.name===edge.node))})}
test('six workflow exports exist',()=>assert.equal(flows.length,6));
test('webhook workflows explicitly respond',()=>{for(const[,w]of flows.filter(([,x])=>x.nodes.some(n=>n.type==='n8n-nodes-base.webhook')))assert.ok(w.nodes.some(n=>n.type==='n8n-nodes-base.respondToWebhook'))});
test('persistence covers evidence variants claims QA and reviews',()=>{const text=JSON.stringify(flows);for(const table of['brief_evidence','content_variants','claim_ledger','qa_findings','review_decisions','export_manifests','dead_letter'])assert.match(text,new RegExp(table))});
