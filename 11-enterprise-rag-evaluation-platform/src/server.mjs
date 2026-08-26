import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { evaluateCase, aggregateResults } from './core.mjs';
const port = Number(process.env.PORT || 8110);
const send = (res, status, body) => { res.writeHead(status, {'content-type':'application/json'}); res.end(JSON.stringify(body)); };
export const createServer = () => http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { status:'ok', evidenceMode:process.env.EVIDENCE_MODE || 'simulated' });
  if (req.method === 'POST' && req.url === '/evaluate') {
    let body=''; for await (const chunk of req) body += chunk;
    try { const input=JSON.parse(body); const results=input.cases.map((testCase,index)=>evaluateCase(testCase,input.documents,input.answers[index],input.options)); return send(res,200,{results,summary:aggregateResults(results,input.gates)}); }
    catch(error) { return send(res,400,{error:error.message}); }
  }
  return send(res,404,{error:'not found'});
});
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) createServer().listen(port,()=>console.log(`RAG evaluation engine on ${port}`));
