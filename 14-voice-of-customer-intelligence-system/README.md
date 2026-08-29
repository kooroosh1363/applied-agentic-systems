# Voice-of-Customer Intelligence System

A deterministic, local-first reference system for turning consented customer feedback into evidence-linked, reviewable insights. It ingests survey, support, review, social, interview, and email feedback; redacts common PII; blocks prompt-injection and secret patterns; classifies topics and sentiment; routes urgent signals to human triage; aggregates only sufficiently large and diverse groups; and produces a fingerprinted export manifest.

## What this project proves

- Every review-ready insight cites the exact feedback IDs and redacted evidence quotes behind it.
- Non-consented, blocked, duplicate, or low-sample feedback cannot become a published aggregate claim.
- Urgent signals create a human-triage case and never contact a customer automatically.
- Keyword-based local classification is deterministic and testable; it is not presented as a trained production model.
- All fixture-derived metrics are labeled `simulated`.

## Local demo

```bash
npm test
npm run demo
docker compose up --build
curl http://localhost:8140/health
```

No paid API, cloud account, or card is required. The default system uses Node.js, PostgreSQL, n8n, and deterministic local rules.

## API

| Endpoint | Purpose |
|---|---|
| `GET /health` | Runtime mode and evidence boundary |
| `POST /analyze` | Deduplicate, redact, classify, triage, and aggregate a batch |
| `POST /trends` | Compare topic volume between two analyzed periods |
| `POST /review` | Record an authorized analyst decision |

## Guardrails

- Consent is required for aggregate use.
- Minimum group size defaults to 3; minimum source-channel diversity defaults to 2.
- Raw `customerRef` is removed from analysis records and common email/phone patterns are redacted.
- Prompt injection, payment-card-like text, and exposed secret patterns block classification.
- `insufficient_evidence` has no claim and no evidence quote export.
- Publication requires `voc_analyst` or `customer_experience_lead` approval.
- Retry is capped at three attempts before DLQ.

## Repository map

- `src/core.mjs`: privacy, dedupe, classification, urgency, aggregation, trends, review, manifest
- `src/server.mjs`: zero-dependency HTTP API
- `workflows/`: five inactive importable n8n workflows
- `contracts/`: feedback event JSON Schema
- `database/`: PostgreSQL audit, insight, outbox, and DLQ tables
- `examples/`: English/Persian feedback and an unsafe payload
- `tests/`: deterministic unit, API, and workflow validation
- `docs/`: architecture, methodology, testing, security, and operations

## Evidence boundary

This repository demonstrates engineering controls with synthetic fixtures. It does not claim production accuracy, customer impact, or real provider delivery. Before real deployment, validate multilingual performance on representative consented data, use jurisdiction-specific retention controls, and complete privacy/security review.
