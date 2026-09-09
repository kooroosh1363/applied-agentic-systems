# Event-Driven Automation Platform

A local-first, deterministic reference for receiving signed CloudEvents, enforcing tenant boundaries, preserving aggregate order, routing events to workflows, and handling delivery failures without silent loss or uncontrolled replay.

## Engineering boundaries

- Tenant identity comes from the API key, never from the event or request body.
- Events require a timestamped HMAC signature; stale or modified payloads are rejected.
- Producer event IDs are deduplicated inside the tenant and source boundary.
- Per-aggregate sequence gaps and old sequences enter quarantine rather than being guessed into order.
- Delivery retries are bounded; exhausted deliveries enter a DLQ with `replayAuthorized=false`.
- Audit events form a tenant-specific HMAC chain.
- The default path is local and free. No external event bus, provider delivery, payment, or cloud account is claimed.

## Run

```bash
npm run demo
npm test
npm start
```

## What is demonstrated

CloudEvents-style contracts, HMAC verification, replay-window protection, tenant-scoped API keys, deduplication, ordering, routing, inbox/outbox modeling, retry/backoff, quarantine, DLQ approval, metrics, PostgreSQL constraints and RLS, plus inactive importable n8n workflows.

## Production gap

The executable engine is intentionally in-memory for deterministic tests. A production deployment still requires a real broker, transactional inbox/outbox workers, PostgreSQL integration with a non-owner runtime role, secret management and rotation, distributed rate limiting, tracing, load/chaos tests, and backup/restore evidence.
