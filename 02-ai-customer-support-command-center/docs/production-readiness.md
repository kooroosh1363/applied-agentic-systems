# Production readiness checklist

Implemented: versioned contract, idempotency, durable lifecycle state, approval gate, retry cap, DLQ, audit records, PII redaction, health endpoint, metrics, deterministic tests, pinned container versions, and zero-cost local setup.

Before production: provider signature validation; per-tenant RBAC and isolation; secret manager; TLS; database migrations/backup/restore drill; HA sizing; data retention and deletion workflow; real provider contract tests; load/soak tests; alert thresholds and on-call runbook; accessibility/localization review; legal/privacy review; and measured SLOs.
