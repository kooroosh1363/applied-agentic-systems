# Security and operations

## Security controls

- Actor scopes are evaluated against every cited source; source presence is not authorization.
- Prompt injection and secret patterns are checked in both user input and retrieved evidence.
- Fabricated citations and numeric/unit mismatches are blocking failures.
- Non-retryable safety failures skip regeneration and enter the DLQ.
- Audit events carry a previous hash and content hash so later mutation is detectable.
- Example credentials are local placeholders; no real secret is checked in.

## Production readiness gaps

Use external identity and policy services, encrypted transport/storage, a secrets manager, durable queues, database row-level security, signed audit retention, reviewer RBAC, rate limits, request-size limits, full PII classification, incident response and regional retention controls. The regex scanner is defense-in-depth, not a complete DLP product.

Operational alerts should cover block/review spikes, retry exhaustion, DLQ age, reviewer backlog, false-positive drift, policy-version skew and audit-chain failures.
