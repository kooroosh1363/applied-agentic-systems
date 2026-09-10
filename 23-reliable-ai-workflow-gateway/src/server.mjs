import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { Gateway, GatewayError, localClassifier } from './gateway.mjs';

export function buildServer(gateway) {
  return http.createServer(async (req, res) => {
    const send = (status, value) => {
      res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
      res.end(JSON.stringify(value));
    };
    try {
      if (req.method === 'GET' && req.url === '/health') return send(200, { mode: 'local-mock' });
      if (req.method !== 'POST' || req.url !== '/v1/execute') return send(404, { error: 'not_found' });
      const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
      gateway.authenticate(token);
      if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new GatewayError('content_type_required', 415);
      const chunks = []; let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 16384) throw new GatewayError('body_too_large', 413);
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw new GatewayError('invalid_json'); }
      const result = await gateway.execute(token, body);
      send(result.status === 'succeeded' ? 200 : result.status === 'unknown' ? 504 : 502, result);
    } catch (error) { send(error instanceof GatewayError ? error.status : 500, { error: error instanceof GatewayError ? error.code : 'internal_error' }); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // No built-in credentials. Fail closed unless the operator provides one.
  const gateway = new Gateway({ credentials: [{ token: process.env.GATEWAY_TOKEN, tenant: 'local', workflows: ['classify-v1'] }], adapter: localClassifier });
  buildServer(gateway).listen(3000, '0.0.0.0');
}
