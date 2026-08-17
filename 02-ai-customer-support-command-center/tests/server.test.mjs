import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupportEngineServer } from '../src/server.mjs';

async function withServer(run){const server=createSupportEngineServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const {port}=server.address();try{await run(`http://127.0.0.1:${port}`)}finally{await new Promise(r=>server.close(r));}}
const ticket={sourceEventId:'evt-2',channel:'webchat',customerId:'cust-2',subject:'Login error',message:'My account login failed and password reset is not working'};
test('health exposes deterministic mode',()=>withServer(async base=>{const r=await fetch(`${base}/health`);assert.equal(r.status,200);assert.equal((await r.json()).aiMode,'deterministic')}));
test('analysis endpoint returns classification, citations, and route',()=>withServer(async base=>{const r=await fetch(`${base}/v1/analyze`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(ticket)});assert.equal(r.status,200);const b=await r.json();assert.ok(b.classification.category);assert.ok(Array.isArray(b.draft.citations));assert.ok(b.decision.route)}));
test('delivery supports success and controlled failures',()=>withServer(async base=>{for(const [simulate,status] of [['',202],['rate_limit',429],['permanent_failure',422]]){const r=await fetch(`${base}/v1/deliver`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idempotencyKey:'abcdef1234567890',destination:'user-1',message:'hello',simulate})});assert.equal(r.status,status)}}));
test('metrics are prometheus compatible',()=>withServer(async base=>{const r=await fetch(`${base}/metrics`);assert.equal(r.status,200);assert.match(await r.text(),/support_engine_analyzed_total/)}));

