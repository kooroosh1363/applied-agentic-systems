import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { ControlPlane, ControlError } from './control-plane.mjs';
export function buildServer(plane) {
  return http.createServer(async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'content-type': 'application/json',
      'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify(body)); };
    try {
      if (req.method === 'GET' && req.url === '/health') return send(200, { mode: 'local-simulation' });
      const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
      plane.authenticate(token);
      if (req.method === 'GET' && req.url === '/v1/audit') return send(200, plane.audit(token));
      const match = /^\/v1\/(state|resolve)\/([a-zA-Z0-9_-]{1,64})$/.exec(req.url);
      if (req.method === 'GET' && match) return send(200, match[1] === 'state' ? plane.read(token, match[2]) : plane.resolve(token, match[2]));
      if (req.method !== 'POST' || req.url !== '/v1/commands') return send(404, { error: 'not_found' });
      if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new ControlError('content_type_required', 415);
      let bytes = 0; const chunks = [];
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 8192) throw new ControlError('body_too_large', 413);
        chunks.push(chunk);
      }
      let input;
      try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw new ControlError('invalid_json'); }
      send(200, plane.command(token, input));
    } catch (error) {
      send(error instanceof ControlError ? error.status : 500,
        { error: error instanceof ControlError ? error.code : 'internal_error' });
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const credentials = JSON.parse(process.env.CONTROL_CREDENTIALS || 'null');
  buildServer(new ControlPlane({ credentials })).listen(3000, '0.0.0.0');
}
