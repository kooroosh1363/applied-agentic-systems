import {createServer} from 'node:http';
import {normalizeSignal,signalKey,deduplicateTopics,scoreTopic,transitionTopic,recordPerformance,computeKpis,classifyDelivery} from './core.mjs';
const metrics={signals:0,topicsScored:0,reviewRequired:0,securityFlags:0,deliveryFailures:0};
const json=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body));};
async function readBody(req){let value='';for await(const chunk of req){value+=chunk;if(value.length>1e6)throw new Error('payload too large');}return value?JSON.parse(value):{};}
export function createContentServer(){return createServer(async(req,res)=>{try{
  if(req.method==='GET'&&req.url==='/health')return json(res,200,{status:'ok',mode:'deterministic-local',paidApis:false});
  if(req.method==='GET'&&req.url==='/metrics'){res.writeHead(200,{'content-type':'text/plain'});return res.end(Object.entries(metrics).map(([k,v])=>`content_intelligence_${k}_total ${v}`).join('\n')+'\n');}
  if(req.method==='POST'&&req.url==='/v1/signals'){const signal=normalizeSignal(await readBody(req));metrics.signals++;return json(res,200,{signal,idempotencyKey:signalKey(signal),evidenceBoundary:signal.evidenceType});}
  if(req.method==='POST'&&req.url==='/v1/topics/score'){const input=await readBody(req),signalList=(input.evidence??[]).map(normalizeSignal),topics=deduplicateTopics(input.candidates??[]).map(topic=>({...topic,score:scoreTopic(topic,signalList.filter(x=>(topic.evidenceIds??[]).includes(x.sourceEventId)),input.brandPolicy??{})}));metrics.topicsScored+=topics.length;metrics.reviewRequired+=topics.filter(x=>x.score.decision==='needs_review').length;metrics.securityFlags+=topics.filter(x=>x.score.flags.promptInjectionDetected).length;return json(res,200,{topics,model:'deterministic-v1',evidence:'computed'});}
  if(req.method==='POST'&&req.url==='/v1/topics/transition'){const x=await readBody(req);return json(res,200,transitionTopic(x.topic,x.to,x.actor,x.role));}
  if(req.method==='POST'&&req.url==='/v1/performance'){return json(res,200,recordPerformance(await readBody(req)));}
  if(req.method==='POST'&&req.url==='/v1/kpis'){const x=await readBody(req);return json(res,200,computeKpis(x.topics??[],(x.performance??[]).map(recordPerformance)));}
  if(req.method==='POST'&&req.url==='/v1/deliver'){const x=await readBody(req),status=x.simulate==='rate_limit'?429:x.simulate==='permanent_failure'?422:202,outcome=classifyDelivery(status,x.attempt??1);if(status>=400)metrics.deliveryFailures++;return json(res,status,{outcome,provider:'local-mock'});}
  return json(res,404,{error:'not found'});
}catch(error){return json(res,400,{error:error.message});}});}
if(process.argv[1]===new URL(import.meta.url).pathname)createContentServer().listen(Number(process.env.PORT??8086),'0.0.0.0');
