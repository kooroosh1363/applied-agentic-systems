import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { verifyCandidate, planRetry, appendAuditEvent } from './core.mjs';
const port = Number(process.env.PORT || 8120);
const send=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body));};
export const createServer=()=>http.createServer(async(req,res)=>{
  if(req.method==='GET'&&req.url==='/health') return send(res,200,{status:'ok',evidenceMode:process.env.EVIDENCE_MODE||'simulated'});
  if(req.method==='POST'&&req.url==='/verify'){
    let body='';for await(const chunk of req)body+=chunk;
    try{const input=JSON.parse(body);const verification=verifyCandidate(input.request,input.evidence,input.candidate,input.options);const retry=planRetry(verification,input.attempt??0);const audit=appendAuditEvent([], {type:'verification_completed',requestId:verification.requestId,decision:verification.decision});return send(res,200,{verification,retry,audit});}
    catch(error){return send(res,400,{error:error.message});}
  }
  return send(res,404,{error:'not found'});
});
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)createServer().listen(port,()=>console.log(`Hallucination firewall on ${port}`));
