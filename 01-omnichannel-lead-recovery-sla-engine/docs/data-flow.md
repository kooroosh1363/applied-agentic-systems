# Data Flow

1. A channel adapter sends a lead event to the n8n webhook.
2. The workflow validates the channel, source ID, contact method, message, and timestamp.
3. A SHA-256 idempotency key is derived from channel plus provider event ID.
4. PostgreSQL inserts the immutable event with `ON CONFLICT DO NOTHING`.
5. Duplicate events receive a successful duplicate response and cause no new side effect.
6. New events are scored using documented rules.
7. Lead state and SLA deadline are persisted.
8. Emergency, high-value, or overdue cases are assigned to human handoff.
9. Consent-safe lower-risk cases may enter the provider adapter.
10. The scheduled dispatcher classifies 429/5xx failures, applies bounded exponential backoff, and writes exhausted or permanent failures to the DLQ.
11. Audit and metric signals support investigation and KPI calculation.

The two importable workflows split synchronous intake from asynchronous delivery so a provider outage does not hold the inbound webhook open.
