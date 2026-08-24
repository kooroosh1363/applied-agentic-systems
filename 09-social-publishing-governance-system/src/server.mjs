import http from 'node:http';
import { normalizePublication, createPublication, validatePolicy } from './core.mjs';
import policy from '../policies/channel-policy.json' with { type: 'json' };
const port = Number(process.env.PORT || 8089);
const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { status: 'ok', providerMode: process.env.MOCK_PROVIDER_MODE !== 'false' ? 'mock' : 'external' });
  if (req.method === 'POST' && req.url === '/publications/validate') {
    let body = ''; for await (const chunk of req) body += chunk;
    try { const publication = normalizePublication(JSON.parse(body)); return json(res, 200, { publication: createPublication(publication), policy: validatePolicy(publication, policy) }); }
    catch (error) { return json(res, 400, { error: error.message }); }
  }
  return json(res, 404, { error: 'not found' });
}).listen(port, () => console.log(`publishing governance engine on ${port}`));
