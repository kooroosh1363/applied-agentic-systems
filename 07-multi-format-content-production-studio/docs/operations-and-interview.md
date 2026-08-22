# Operations, cost and interview defense

## KPI and cost

Operational KPIs are QA failure rate, approval lead time, revision count, export success rate, retry/DLQ rate and provider-verified releases. Business KPIs such as conversion or revenue are valid only after real tracking data is connected.

The default local variable cost is $0: deterministic Node.js logic, PostgreSQL, n8n, Prometheus and Grafana. Real cost per execution should be calculated as model tokens + media generation + storage + provider requests + allocated infrastructure. The repository deliberately does not invent a dollar figure without measured usage.

## Trade-offs

- Deterministic templates are testable and free, but less creative than a model.
- One normalized package improves consistency, but format-native specialists may create stronger channel-specific work.
- Multiple human roles increase safety and auditability, but also approval latency.
- Regex guardrails are transparent and fast, but should be supplemented by stronger classifiers for production.
- Immutable versions simplify defense and rollback, but consume more storage.

## Production readiness

Implemented: schemas, versions, idempotency, state machine, approval matrix, audit evidence, retry/DLQ, metrics, health check, fixtures and CI-ready tests.

Required before real production: OAuth/provider adapters, verified RBAC, managed secrets, TLS, backup/restore drill, alert routing, load/SLO tests, media licensing policy, legal/privacy review and provider sandbox certification.

## Interview questions and short answers

**Why is this not just a prompt chain?** Because the durable objects are a brief, evidence ledger, brand version, five contracts, QA findings, role decisions and an immutable export—not an ephemeral model response.

**How do you prevent hallucinated claims?** Factual claims must reference evidence IDs, QA blocks unsupported or unknown references, and a factual reviewer is mandatory. This reduces risk; it does not claim perfect truth detection.

**Why human approval?** Brand and factual judgment have different owners. Sensitive claims add legal review, and every role approves the exact package version.

**What happens on replay?** Stable identities and database unique constraints make brief, package, variant, review and export writes idempotent.

**How would you add an LLM?** Behind the producer interface. Its output remains untrusted and must satisfy the same contracts, QA, versioning and approval path.

**What proves production readiness?** This is production-oriented evidence, not a claim of customer production operation. Live provider tests, SLO/load evidence, identity controls and recovery drills are still needed.

## 60-second defense

“Project 07 turns one evidence-backed, versioned brief into five channel-specific content contracts. n8n orchestrates the process, a free deterministic Node engine makes the system reproducible, and PostgreSQL keeps the brief, evidence, variants, claims, QA findings and human approvals. Every package is tied to an exact brand version and fingerprint. Unsupported claims, prompt injection, PII and format defects block export. Brand and factual reviewers—and legal for sensitive content—approve the same immutable version. Delivery has bounded retry and DLQ, and simulated results are never presented as business outcomes.”
