# Customer Success Intervention Agent

A deterministic, local-first multi-agent system for evidence-backed customer health evaluation, governed intervention recommendations, contact-policy enforcement, human review, mock delivery drafting, observational outcome tracking, and tamper-evident audit.

## What it demonstrates

- versioned customer cases and strict customer-bound signals from allowlisted systems;
- six specialized agents with bounded tools, steps, and parallel work groups;
- deterministic health scoring with cited signal IDs, confidence thresholds, missing-evidence handling, and explicit risk drivers;
- consent, do-not-contact, legal-hold, dispute, hardship, frequency-cap, cooldown, quiet-hour, and channel controls;
- priority playbooks for service recovery, finance-sensitive support, adoption coaching, renewal review, and human check-in;
- role-authorized approval that still grants no delivery, discount, billing, or contractual authority;
- mock-only drafts with unresolved recipients and mandatory personalization;
- observational outcome records that never claim causal churn reduction or saved revenue;
- hash-chained case timeline, fingerprints, bounded retry, DLQ, manifest, API, CLI, PostgreSQL, Prometheus, five inactive n8n workflows, and Docker Compose.

## Distinction from earlier projects

Project 2 manages support tickets and escalations. Project 14 analyzes voice-of-customer feedback. Project 10 implements controlled experimentation. Project 19 joins governed operational signals into a customer-success case, proposes a bounded intervention, enforces contact policy, requires role-aware approval, and records outcomes without silently converting correlation into causation.

## Trust boundary

All customers, contacts, signals, scores, recommendations, and outcomes are synthetic. The health score is a deterministic fixture, not a trained or validated churn model. The default system does not resolve recipients, send messages, change accounts, grant discounts, make renewal promises, process payments, or claim retained revenue.

## Run locally

```bash
npm test
npm run demo
npm start
```

Or:

```bash
cp .env.example .env
docker compose up --build
```

No paid API, payment card, or cloud account is required.

## API

`GET /health`, `GET /metrics`, and POST routes for `/plan`, `/health-score`, `/policy-gate`, `/recommend`, `/approve`, `/draft`, `/outcome`, `/timeline`, `/verify-timeline`, `/retry`, and `/manifest`.

## Important limitations

The sample quiet-hour check is UTC-only; production needs verified customer timezones and daylight-saving handling. Organization-specific score calibration, fairness review, consent provenance, tenant isolation, real identity resolution, authenticated providers, retention policy, and legal review are not implied by passing tests. See `docs/` for the complete boundary.
