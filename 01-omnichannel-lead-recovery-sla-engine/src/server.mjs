import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export function createMockProviderServer() {
  const metrics = { requests: 0, delivered: 0, failed: 0 };

  return createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') return json(response, 200, { status: 'ok' });
    if (request.method === 'GET' && request.url === '/metrics') {
      response.writeHead(200, { 'content-type': 'text/plain; version=0.0.4' });
      return response.end([
        `mock_provider_requests_total ${metrics.requests}`,
        `mock_provider_delivered_total ${metrics.delivered}`,
        `mock_provider_failed_total ${metrics.failed}`,
        ''
      ].join('\n'));
    }

    if (request.method !== 'POST' || request.url !== '/v1/messages') return json(response, 404, { error: 'not_found' });
    metrics.requests++;

    try {
      const body = await readJson(request);
      if (!body.idempotencyKey || !body.destination || !body.message) {
        metrics.failed++;
        return json(response, 400, { error: 'invalid_message' });
      }
      if (body.simulate === 'timeout') return setTimeout(() => json(response, 504, { error: 'simulated_timeout' }), 50);
      if (body.simulate === 'rate_limit') {
        metrics.failed++;
        response.setHeader('retry-after', '1');
        return json(response, 429, { error: 'simulated_rate_limit' });
      }
      if (body.simulate === 'permanent_failure') {
        metrics.failed++;
        return json(response, 422, { error: 'simulated_permanent_failure' });
      }

      metrics.delivered++;
      return json(response, 202, {
        status: 'accepted',
        provider: 'local-mock',
        providerMessageId: `mock-${body.idempotencyKey.slice(0, 12)}`,
        evidence: 'simulated'
      });
    } catch {
      metrics.failed++;
      return json(response, 400, { error: 'invalid_json' });
    }
  });
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error('payload_too_large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 8080);
  createMockProviderServer().listen(port, '0.0.0.0', () => console.log(`Mock provider listening on ${port}`));
}

