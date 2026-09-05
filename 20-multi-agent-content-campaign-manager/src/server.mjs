import http from 'node:http';
import {buildWorkGraph,validateClaims,allocateBudget,draftAssets,reviewAsset,buildCampaignPacket,buildPublishingHandoff,buildExperimentHandoff,detectAgentConflicts,recordOutcome,appendAudit,verifyAudit,nextRetry,buildManifest} from './core.mjs';
const metrics={requests:0,errors:0,plans:0,drafts:0};
const json=(res,status,payload)=>{const body=JSON.stringify(payload);res.writeHead(status,{'content-type':'application/json','content-length':Buffer.byteLength(body)});res.end(body);};
const read=req=>new Promise((resolve,reject)=>{let body='';req.on('data',chunk=>{body+=chunk;if(body.length>1_000_000)reject(new Error('payload too large'));});req.on('end',()=>{try{resolve(body?JSON.parse(body):{});}catch{reject(new Error('invalid JSON'));}});req.on('error',reject);});
export function createServer(){return http.createServer(async(req,res)=>{metrics.requests++;try{
 if(req.method==='GET'&&req.url==='/health')return json(res,200,{status:'ok',mode:'deterministic',deliveryMode:'mock',autoPublish:false,spendAuthorized:false,causalClaimAllowed:false});
 if(req.method==='GET'&&req.url==='/metrics'){const body=`campaign_requests_total ${metrics.requests}\ncampaign_errors_total ${metrics.errors}\ncampaign_plans_total ${metrics.plans}\ncampaign_drafts_total ${metrics.drafts}\n`;res.writeHead(200,{'content-type':'text/plain; version=0.0.4'});return res.end(body);}
 if(req.method!=='POST')return json(res,404,{error:'not found'});const b=await read(req);const routes={
  '/work-graph':()=>{metrics.plans++;return buildWorkGraph(b.brief);},
  '/claims':()=>validateClaims(b.brief,b.claims),
  '/budget':()=>allocateBudget(b.brief,b.weights),
  '/draft-assets':()=>{metrics.drafts++;return draftAssets(b.brief,b.claims);},
  '/review-asset':()=>reviewAsset(b.brief,b.asset,b.review),
  '/campaign-packet':()=>buildCampaignPacket(b.brief,b.graph,b.drafts,b.budget,b.reviews),
  '/publishing-handoff':()=>buildPublishingHandoff(b.brief,b.packet,b.drafts),
  '/experiment-handoff':()=>buildExperimentHandoff(b.brief,b.packet),
  '/conflicts':()=>detectAgentConflicts(b.proposals),
  '/outcome':()=>recordOutcome(b.packet,b.outcome),
  '/audit':()=>appendAudit(b.events,b.event),
  '/verify-audit':()=>verifyAudit(b.events),
  '/retry':()=>nextRetry(b.job),
  '/manifest':()=>buildManifest(b.brief,b.graph,b.drafts,b.budget,b.packet,b.audit,b.publishingHandoff,b.experimentHandoff)
 };if(!routes[req.url])return json(res,404,{error:'not found'});return json(res,200,routes[req.url]());
 }catch(error){metrics.errors++;return json(res,400,{error:error.message});}});}
if(import.meta.url===`file://${process.argv[1]}`){const port=Number(process.env.PORT??8200);createServer().listen(port,()=>console.log(`campaign manager listening on ${port}`));}
