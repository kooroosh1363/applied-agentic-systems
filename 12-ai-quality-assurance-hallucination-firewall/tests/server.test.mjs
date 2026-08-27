import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer } from '../src/server.mjs';
const fixture=JSON.parse(await readFile(new URL('../examples/verified-answer.json',import.meta.url)));
async function withServer(run){const server=createServer().listen(0);await once(server,'listening');try{return await run(`http://127.0.0.1:${server.address().port}`)}finally{server.close();await once(server,'close')}}
test('health reports simulated mode',()=>withServer(async base=>{const response=await fetch(`${base}/health`);assert.equal(response.status,200);assert.equal((await response.json()).evidenceMode,'simulated')}));
test('verify endpoint returns decision retry and audit',()=>withServer(async base=>{const response=await fetch(`${base}/verify`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(fixture)});const body=await response.json();assert.equal(body.verification.decision,'allow');assert.equal(body.retry.action,'complete');assert.equal(body.audit.length,1)}));
test('invalid request returns 400',()=>withServer(async base=>assert.equal((await fetch(`${base}/verify`,{method:'POST',body:'{}'})).status,400)));
test('unknown route returns 404',()=>withServer(async base=>assert.equal((await fetch(`${base}/missing`)).status,404)));
