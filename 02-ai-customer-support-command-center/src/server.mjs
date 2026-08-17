import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { analyzeTicket } from './core.mjs';

const articles = JSON.parse(await readFile(new URL('../knowledge/articles.json', import.meta.url), 'utf8'));

export function createSupportEngineServer() {
  const metrics = { analyzed: 0, auto: 0, approval: 0, escalated: 0, delivered: 0, failed: 0 };
  return createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') return json(response, 200, { status: 'ok', aiMode: process.env.AI_MODE || 'deterministic' });
    if (request.method === 'GET' && request.url === '/metrics') return metricsResponse(response, metrics);
    if (request.method !== 'POST') return json(response, 404, { error: 'not_found' });
    try {
      const body = await readJson(request);
      if (request.url === '/v1/analyze') {
        const result = analyzeTicket(body, articles);
        metrics.analyzed++;
        if (result.decision.route === 'auto_reply') metrics.auto++;
        else if (result.decision.route === 'approval_required') metrics.approval++;
        else metrics.escalated++;
        return json(response, 200, result);
      }
      if (request.url === '/v1/deliver') {
        if (!body.idempotencyKey || !body.destination || !body.message) return json(response, 400, { error: 'invalid_delivery' });
        if (body.simulate === 'rate_limit') { metrics.failed++; response.setHeader('retry-after', '1'); return json(response, 429, { error: 'simulated_rate_limit' }); }
        if (body.simulate === 'permanent_failure') { metrics.failed++; return json(response, 422, { error: 'simulated_permanent_failure' }); }
        metrics.delivered++;
        return json(response, 202, { status: 'accepted', provider: 'local-mock', providerMessageId: `support-${body.idempotencyKey.slice(0, 12)}`, evidence: 'simulated' });
      }
      return json(response, 404, { error: 'not_found' });
    } catch (error) {
      return json(response, 400, { error: 'invalid_request', detail: error.message });
    }
  });
}

async function readJson(request) {
  const chunks = []; let size = 0;
  for await (const chunk of request) { size += chunk.length; if (size > 128 * 1024) throw new Error('payload_too_large'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function json(response, status, body) { response.writeHead(status, { 'content-type': 'application/json' }); response.end(JSON.stringify(body)); }
function metricsResponse(response, m) {
  response.writeHead(200, { 'content-type': 'text/plain; version=0.0.4' });
  response.end(Object.entries(m).map(([key, value]) => `support_engine_${key}_total ${value}`).join('\n') + '\n');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 8081);
  createSupportEngineServer().listen(port, '0.0.0.0', () => console.log(`Support engine listening on ${port}`));
}

