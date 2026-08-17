import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockProviderServer } from '../src/server.mjs';

async function withServer(run) {
  const server = createMockProviderServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try { await run(`http://127.0.0.1:${port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test('health endpoint is available', () => withServer(async (base) => {
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
}));

test('accepts a deterministic mock delivery', () => withServer(async (base) => {
  const response = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idempotencyKey: 'abcdef1234567890', destination: '+16045550100', message: 'Hello' })
  });
  assert.equal(response.status, 202);
  const body = await response.json();
  assert.equal(body.providerMessageId, 'mock-abcdef123456');
  assert.equal(body.evidence, 'simulated');
}));

test('simulates retriable and permanent provider failures', () => withServer(async (base) => {
  for (const [simulate, status] of [['rate_limit', 429], ['permanent_failure', 422], ['timeout', 504]]) {
    const response = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idempotencyKey: 'abcdef1234567890', destination: 'x', message: 'x', simulate })
    });
    assert.equal(response.status, status);
  }
}));

test('exports Prometheus metrics', () => withServer(async (base) => {
  const response = await fetch(`${base}/metrics`);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /mock_provider_requests_total/);
}));

