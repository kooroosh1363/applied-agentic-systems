# Multi-Agent Content Campaign Manager

A deterministic, local-first multi-agent campaign coordinator for versioned briefs, evidence-backed claims, bounded work graphs, channel asset drafting, integer-money budget planning, multi-role review, governed Project 09/10 handoffs, observational outcomes, and tamper-evident audit.

## What it demonstrates

- seven specialized agents operating through an acyclic ten-step work graph and explicit agent/tool budgets;
- campaign identity, version, owner, schedule, currency, integer budget, locale, brand policy, channel, KPI, and source-evidence contracts;
- approved-evidence claim gates, confidence thresholds, HTTPS provenance, unsafe-text scanning, PII blocking, and no fabricated translations;
- deterministic channel drafts with claim IDs, limits, policy version, fingerprints, and review-required status;
- ten-percent budget reserve and per-channel planning allocations that never authorize spend;
- marketing, brand, and risk-dependent compliance approval separation;
- conflict detection where agent consensus cannot override policy;
- a publishing handoff to Project 09 that still requires publication-policy validation and remains unscheduled;
- an experiment handoff to Project 10 with assignment, control, causal claims, and revenue attribution unconfigured;
- hash-chained audit, fingerprints, bounded retry, DLQ, manifest, API, CLI, PostgreSQL, Prometheus, five inactive n8n workflows, and Docker Compose.

## Distinction from Projects 6-10

Projects 6-8 analyze, produce, repurpose, and localize content. Project 9 governs publication. Project 10 governs experimentation and attribution. Project 20 coordinates an entire multi-agent campaign across strategy, evidence, assets, budget planning, roles, and downstream handoffs without duplicating or bypassing those specialized systems.

## Trust boundary

All briefs, evidence, assets, budgets, reviews, and outcomes are synthetic. The system does not publish, schedule, contact an audience, access an ad account, authorize spend, translate missing copy, or claim campaign lift or revenue. `ready_for_handoff_review` is not permission to execute.

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

`GET /health`, `GET /metrics`, and POST routes for `/work-graph`, `/claims`, `/budget`, `/draft-assets`, `/review-asset`, `/campaign-packet`, `/publishing-handoff`, `/experiment-handoff`, `/conflicts`, `/outcome`, `/audit`, `/verify-audit`, `/retry`, and `/manifest`.

## Evidence boundary

Green tests prove deterministic implementation behavior only. They do not prove campaign quality, legal clearance, production publishing, real spend, causal lift, or revenue attribution. See `docs/` for architecture, agent boundaries, evidence rules, security, operations, and testing.
