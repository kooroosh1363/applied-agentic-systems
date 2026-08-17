# Known Limitations

- Real Meta, WhatsApp, email, CRM, phone, and payment providers are not configured or claimed.
- DLQ writes and bounded retries are implemented, but an operator-authorized DLQ replay workflow is intentionally not automated yet.
- n8n Code-node rules and the tested reference module must be kept aligned manually until a shared package boundary is introduced.
- Local Compose has not been load-tested or security-hardened for internet exposure.
- Contact deduplication across different provider event IDs is conservative; identity resolution needs domain-specific policy.
- Scoring weights are hypotheses, not learned customer coefficients.
- Grafana currently exposes provider adapter counters; database/SLA panels require a PostgreSQL exporter or metrics workflow.
