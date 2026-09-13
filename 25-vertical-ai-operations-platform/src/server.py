"""Local API. Run behind TLS/authenticated ingress for nonlocal deployment."""
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from operations import Platform, DomainError


def build_server(service, host='127.0.0.1', port=3025):
    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            super().setup()
            self.connection.settimeout(10)

        def log_message(self, *_):
            pass  # Do not put credentials or caller-controlled request text in logs.

        def send_json(self, status, body):
            payload = json.dumps(body).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(payload)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            self.wfile.write(payload)

        def token(self):
            header = self.headers.get('Authorization', '')
            return header[7:] if header.startswith('Bearer ') else ''

        def do_GET(self):
            try:
                if self.path == '/health':
                    self.send_json(200, {'mode': 'local-simulation'})
                    return
                service.authenticate(self.token(), 'viewer')
                if self.path != '/v1/snapshot':
                    self.send_json(404, {'error': 'not_found'})
                    return
                self.send_json(200, service.snapshot(self.token()))
            except DomainError as exc:
                self.send_json(exc.status, {'error': exc.code})
            except Exception:
                self.send_json(503, {'error': 'storage_unavailable'})

        def do_POST(self):
            try:
                service.authenticate(self.token())
                if self.path != '/v1/commands':
                    self.send_json(404, {'error': 'not_found'})
                    return
                if self.headers.get('Transfer-Encoding'):
                    raise DomainError('transfer_encoding_unsupported')
                lengths = self.headers.get_all('Content-Length', [])
                if len(lengths) != 1 or not lengths[0].isdigit():
                    raise DomainError('length_required', 411)
                size = int(lengths[0])
                if size > 8192:
                    raise DomainError('body_too_large', 413)
                if self.headers.get_content_type() != 'application/json':
                    raise DomainError('content_type_required', 415)
                raw = self.rfile.read(size)
                if len(raw) != size:
                    raise DomainError('incomplete_body')
                try:
                    data = json.loads(raw)
                except (ValueError, UnicodeError):
                    raise DomainError('invalid_json') from None
                self.send_json(200, service.command(self.token(), data))
            except DomainError as exc:
                self.send_json(exc.status, {'error': exc.code})
            except TimeoutError:
                self.send_json(408, {'error': 'request_timeout'})
            except Exception:
                self.send_json(500, {'error': 'internal_error'})

    return HTTPServer((host, port), Handler)


if __name__ == '__main__':
    config = json.loads(os.environ['OPERATIONS_CONFIG'])
    path = Path(os.environ.get('OPERATIONS_DB', 'data/operations.db'))
    path.parent.mkdir(parents=True, exist_ok=True)
    service = Platform(str(path), config['credentials'], config['technicians'])
    server = build_server(service, os.environ.get('OPERATIONS_HOST', '127.0.0.1'))
    try:
        server.serve_forever()
    finally:
        server.server_close()
        service.close()
