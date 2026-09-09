# Security and operations

- Use a per-tenant signing key in production; rotate keys with an overlap window and key identifier.
- Store API keys and signing secrets in an external secret manager; never log raw values.
- Terminate TLS before ingest and cap request size at every proxy layer.
- Keep the runtime database role non-owner and set `app.tenant_id` with `SET LOCAL` inside each transaction.
- Do not auto-replay quarantine or DLQ records. Require approver, reason, audit event, and a new controlled delivery attempt.
- Alert on signature failures, quarantine growth, DLQ growth, lag, retry rate, and audit verification failure.
- Treat metrics labels as a data boundary: avoid customer payloads and unbounded event IDs.
