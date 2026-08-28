import http from 'node:http';
import {pathToFileURL}from'node:url';
import{evaluateCompliance,proposeRemediations,compareContractVersions}from'./core.mjs';
const port=Number(process.env.PORT||8130);const send=(r,s,b)=>{r.writeHead(s,{'content-type':'application/json'});r.end(JSON.stringify(b));};
export const createServer=()=>http.createServer(async(req,res)=>{
 if(req.method==='GET'&&req.url==='/health')return send(res,200,{status:'ok',mode:'deterministic-local',evidenceBoundary:process.env.EVIDENCE_MODE||'simulated'});
 let body='';for await(const chunk of req)body+=chunk;
 try{
  const x=body?JSON.parse(body):{};
  if(req.method==='POST'&&req.url==='/evaluate'){const report=evaluateCompliance(x.contract,x.policies,x.options);return send(res,200,{report,remediations:proposeRemediations(report)});}
  if(req.method==='POST'&&req.url==='/compare')return send(res,200,compareContractVersions(x.previous,x.current));
 }catch(error){return send(res,400,{error:error.message});}
 return send(res,404,{error:'not found'});
});
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)createServer().listen(port,()=>console.log(`Compliance copilot on ${port}`));
