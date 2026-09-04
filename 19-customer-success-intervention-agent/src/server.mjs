import http from 'node:http';
import {buildAgentPlan,evaluateHealth,policyGate,recommendIntervention,recordApproval,buildInterventionDraft,recordOutcome,appendTimeline,verifyTimeline,nextRetry,buildManifest} from './core.mjs';
const metrics={requests:0,errors:0,evaluations:0,recommendations:0};
const json=(res,status,payload)=>{const body=JSON.stringify(payload);res.writeHead(status,{'content-type':'application/json','content-length':Buffer.byteLength(body)});res.end(body);};
const read=req=>new Promise((resolve,reject)=>{let body='';req.on('data',chunk=>{body+=chunk;if(body.length>1_000_000)reject(new Error('payload too large'));});req.on('end',()=>{try{resolve(body?JSON.parse(body):{});}catch{reject(new Error('invalid JSON'));}});req.on('error',reject);});
export function createServer(){return http.createServer(async(req,res)=>{metrics.requests++;try{
  if(req.method==='GET'&&req.url==='/health')return json(res,200,{status:'ok',mode:'deterministic',deliveryMode:'mock',autoSend:false,causalClaimAllowed:false});
  if(req.method==='GET'&&req.url==='/metrics'){const body=`customer_success_requests_total ${metrics.requests}\ncustomer_success_errors_total ${metrics.errors}\ncustomer_success_evaluations_total ${metrics.evaluations}\ncustomer_success_recommendations_total ${metrics.recommendations}\n`;res.writeHead(200,{'content-type':'text/plain; version=0.0.4'});return res.end(body);}
  if(req.method!=='POST')return json(res,404,{error:'not found'});
  const body=await read(req);const routes={
    '/plan':()=>buildAgentPlan(body.case),
    '/health-score':()=>{metrics.evaluations++;return evaluateHealth(body.case);},
    '/policy-gate':()=>policyGate(body.case,body.health,body.channel),
    '/recommend':()=>{metrics.recommendations++;return recommendIntervention(body.case,body.channel);},
    '/approve':()=>recordApproval(body.recommendation,body.approval),
    '/draft':()=>buildInterventionDraft(body.case,body.recommendation,body.approval),
    '/outcome':()=>recordOutcome(body.draft,body.outcome),
    '/timeline':()=>appendTimeline(body.events,body.event),
    '/verify-timeline':()=>verifyTimeline(body.events),
    '/retry':()=>nextRetry(body.job),
    '/manifest':()=>buildManifest(body.case,body.plan,body.health,body.recommendation,body.timeline,body.draft,body.outcome)
  };if(!routes[req.url])return json(res,404,{error:'not found'});return json(res,200,routes[req.url]());
}catch(error){metrics.errors++;return json(res,400,{error:error.message});}});}
if(import.meta.url===`file://${process.argv[1]}`){const port=Number(process.env.PORT??8190);createServer().listen(port,()=>console.log(`customer success intervention engine listening on ${port}`));}
