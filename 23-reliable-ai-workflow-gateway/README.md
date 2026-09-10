# 23 — Reliable AI Workflow Gateway

A free, single-process gateway reference implementation that controls admission and execution of a trusted workflow. It provides tenant-scoped credentials, workflow permissions, idempotency, concurrency limits, fixed-window rate limits, deadlines, bounded pre-execution retries, circuit breaking and minimal audit records.

The supplied classifier is a deterministic local mock, not an AI model. Every result says `evidence: local-mock` and `externalDelivery: false`. Output validation checks structure, not factual correctness.

## Run

Requires Node.js 22 or later. No dependencies, account or paid API.

```bash
npm test
npm run demo
export GATEWAY_TOKEN="$(node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))')"
npm start
```

In another terminal with the same token:

```bash
curl http://localhost:3000/v1/execute \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @examples/request.json
```

Alternatively set the token and run `docker compose up`; the host port is 3023. The process refuses a missing or short token. Do not commit generated tokens. `/health` is public. The demo creates an ephemeral token and demonstrates replay with the same execution ID.

## Files and acceptance criteria

- `src/gateway.mjs`: policy, reservations, execution lifecycle and local adapter.
- `src/server.mjs`: HTTP authentication, bounded JSON input and response mapping.
- `src/cli.mjs`: runnable replay demo.
- `tests/gateway.test.mjs`: critical paths and failure scenarios.
- `docs/architecture.md`: data flow, contracts and design choices.
- `docs/operations.md`: monitoring, recovery and production gaps.
- `docs/security.md`: trust boundaries and threats.

Identical concurrent submissions must execute once within the process. Reusing a key with different input must return 409. Tenant identities come from configured credentials. A timed-out adapter must retain its concurrency slot until it actually settles. Unknown outcomes must never be automatically retried. Invalid adapter output must not be returned as success.

This project uses executable Node.js modules and HTTP rather than placeholder n8n workflows. It has no database or durable DLQ. See the operational limitations before connecting a real provider.
