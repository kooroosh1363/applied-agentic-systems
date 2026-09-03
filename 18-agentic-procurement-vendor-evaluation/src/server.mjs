import http from 'node:http';
import {buildAgentPlan,evaluateBids,recordDecisionReview,buildAwardPacket,draftPurchaseOrder,appendAudit,verifyAudit,nextRetry,buildManifest,detectVendorConflicts} from './core.mjs';
const json=(res,status,payload)=>{const body=JSON.stringify(payload);res.writeHead(status,{'content-type':'application/json','content-length':Buffer.byteLength(body)});res.end(body)};
const read=req=>new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>1_000_000)reject(new Error('payload too large'))});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch{reject(new Error('invalid JSON'))}});req.on('error',reject)});
const metrics={requests:0,errors:0,evaluations:0};
export function createServer(){return http.createServer(async(req,res)=>{metrics.requests++;try{
 if(req.method==='GET'&&req.url==='/health')return json(res,200,{status:'ok',mode:'deterministic',evidenceBoundary:'simulated',autoAward:false,autoPurchase:false});
 if(req.method==='GET'&&req.url==='/metrics'){const body=`procurement_requests_total ${metrics.requests}\nprocurement_errors_total ${metrics.errors}\nprocurement_evaluations_total ${metrics.evaluations}\n`;res.writeHead(200,{'content-type':'text/plain; version=0.0.4'});return res.end(body)}
 if(req.method!=='POST')return json(res,404,{error:'not found'});const b=await read(req);
 const routes={
  '/plan':()=>buildAgentPlan(b.request),
  '/evaluate':()=>{metrics.evaluations++;return evaluateBids(b)},
  '/conflicts':()=>detectVendorConflicts(b.vendors??[],b.bids??[]),
  '/review':()=>recordDecisionReview(b.request,b.report,b.review),
  '/award-packet':()=>buildAwardPacket(b.request,b.report,b.reviews),
  '/purchase-order-draft':()=>draftPurchaseOrder(b.request,b.awardPacket,b.details),
  '/audit':()=>appendAudit(b.events,b.event),
  '/verify-audit':()=>verifyAudit(b.events),
  '/retry':()=>nextRetry(b.job),
  '/manifest':()=>buildManifest(b.request,b.plan,b.report,b.audit,b.awardPacket,b.poDraft)
 };if(!routes[req.url])return json(res,404,{error:'not found'});return json(res,200,routes[req.url]());
 }catch(e){metrics.errors++;return json(res,400,{error:e.message})}})}
if(import.meta.url===`file://${process.argv[1]}`){const port=Number(process.env.PORT??8180);createServer().listen(port,()=>console.log(`procurement coordinator listening on ${port}`));}
