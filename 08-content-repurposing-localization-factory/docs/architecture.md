# Architecture and data flow

## Components

| Component | Responsibility | Boundary |
|---|---|---|
| n8n | intake, orchestration, review and retry | does not invent translations |
| Node.js engine | normalization, exact-memory localization, formats, QA and state rules | stateless and replaceable |
| PostgreSQL | source, segments, jobs, variants, findings, reviews and audit | operational source of truth |
| translation memory | approved source-target segment pairs | exact-match reference implementation |
| glossary and locale profiles | terms, forbidden copy, direction and cultural rules | versioned policy inputs |
| Prometheus/Grafana | operational counters and dashboards | no business outcome inference |

## Workflow map

1. `source-intake`: authenticates, validates, fingerprints, and persists the source plus segments once.
2. `repurpose-localize`: locks the exact source version, applies approved memory, creates five format contracts, and stores segments/variants.
3. `localization-quality-gate`: reloads source/job, runs memory, glossary, bidi, subtitle, PII and injection checks, and stores every finding.
4. `human-localization-review`: identifies reviewers, records one decision per role/version, enforces the matrix, and persists state.
5. `localized-export`: requires approval, creates per-file hashes, and moves the exact version to export-ready.
6. `localization-delivery-retry-dlq`: retries transient failures with a bound and stores permanent/exhausted failures in the DLQ.

## Identity model

- source identity: source locale + provider event ID;
- localization job: content ID + source version + target locale + brand version + job version;
- review identity: job ID + job version + reviewer role;
- export identity: job ID + job version.

Database uniqueness constraints enforce replay safety even when orchestration retries.
