# Architecture and data flow

## Components

| Component | Responsibility | Boundary |
|---|---|---|
| n8n | orchestration, schedules and human-review entry points | never decides factual truth |
| Studio engine | normalization, deterministic production, QA and state rules | stateless and replaceable |
| PostgreSQL | identities, versions, evidence, decisions and audit | source of operational truth |
| Prometheus/Grafana | counters and dashboards | no business outcome inference |
| Local delivery mock | reproducible success, retry and permanent failure | not a social provider |

## Node-by-node workflow map

1. `brief-intake`: authenticate, validate the contract, derive idempotency identity, and persist the brief plus evidence once.
2. `multi-format-production`: lock the exact brief/brand version, build an immutable input, produce five contracts, and store package, variants and claims.
3. `content-quality-gate`: reload package/brief/brand, treat output as untrusted, run QA, store every finding, and move state.
4. `human-review-decision`: identify the reviewer, lock the version, persist one decision per role, enforce the required matrix, and return the new state.
5. `package-export`: load only the approved package and its human evidence, create file hashes, and persist one manifest per version.
6. `export-delivery-retry-dlq`: poll due retries, attempt local delivery, apply bounded backoff, and record exhausted delivery in the DLQ.

## Consistency decisions

- The source event generates the brief idempotency key.
- Campaign, topic, brand version and package version generate the package key.
- A package fingerprint covers its complete normalized payload.
- Database uniqueness constraints enforce replay safety even if n8n retries.
- Review decisions are scoped to package ID, package version and reviewer role.
