# Security and operations

## Controls

- prompt-injection and exposed-secret blocking;
- allowlisted signal sources and action types;
- verified-evidence gate for severity;
- action budget, bounded correlation window, retry cap, and no automatic DLQ replay;
- separation between proposal, approval, dispatch packet, and execution;
- role-specific approval for high-risk and security actions;
- no automatic infrastructure execution, publication, state transition, or closure;
- hash-chained timeline with tamper detection.

## Production requirements

Use authenticated read-only telemetry adapters, signed playbooks, short-lived credentials, tenant isolation, strict RBAC, dual control, rate limits, idempotency, immutable audit storage, secret redaction, incident drills, break-glass governance, SLOs, external security review, and tested rollback. Any executor must be a separate least-privilege service with its own authorization and safety checks.
