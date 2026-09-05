import test from 'node:test';import assert from 'node:assert/strict';import {once} from 'node:events';import {readFile} from 'node:fs/promises';import {createServer} from '../src/server.mjs';
const fixture=JSON.parse(await readFile(new URL('../examples/synthetic-campaign.json',import.meta.url),'utf8'));
async function withServer(fn){const server=createServer().listen(0,'127.0.0.1');await once(server,'listening');try{return await fn(`http://127.0.0.1:${server.address().port}`);}finally{server.close();await once(server,'close');}}
const post=(base,path,body)=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
test('health exposes authority boundary',()=>withServer(async base=>{const r=await fetch(base+'/health'),b=await r.json();assert.equal(b.autoPublish,false);assert.equal(b.spendAuthorized,false);assert.equal(b.causalClaimAllowed,false);}));
test('work graph endpoint returns ten steps',()=>withServer(async base=>{const r=await post(base,'/work-graph',{brief:fixture});assert.equal((await r.json()).steps.length,10);}));
test('claim endpoint validates fixture',()=>withServer(async base=>{const r=await post(base,'/claims',{brief:fixture,claims:fixture.claims});assert.equal((await r.json()).valid,true);}));
test('draft endpoint returns three assets',()=>withServer(async base=>{const r=await post(base,'/draft-assets',{brief:fixture,claims:fixture.claims});assert.equal((await r.json()).assets.length,3);}));
test('invalid JSON returns 400',()=>withServer(async base=>assert.equal((await fetch(base+'/work-graph',{method:'POST',body:'{'})).status,400)));
test('unknown route returns 404',()=>withServer(async base=>assert.equal((await fetch(base+'/missing')).status,404)));
test('metrics exposes prometheus text',()=>withServer(async base=>assert.match(await (await fetch(base+'/metrics')).text(),/campaign_requests_total/)));
