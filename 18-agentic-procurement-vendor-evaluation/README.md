# Agentic Procurement & Vendor Evaluation

A deterministic, local-first multi-agent procurement coordinator for bounded sourcing, sealed bid validation, evidence-backed vendor evaluation, compliance gates, total-cost analysis, role-separated review, purchase-order drafting, and tamper-evident audit.

## What it demonstrates

- a versioned procurement request with integer-money budget, deadline, required documents, allowed countries, and weighted criteria;
- six specialized agents operating through explicit agent, tool, step, and vendor budgets;
- vendor identity, bid scope, deadline, currency, document, evidence provenance, freshness, and confidence validation;
- hard constraints that cannot be hidden by a high average score;
- deterministic technical, commercial, risk, compliance, and TCO scorecards with evidence references;
- conflict-pattern detection that routes to review without claiming collusion;
- an explicit fixture-only restricted-party boundary rather than fabricated real sanctions screening;
- procurement, compliance, finance, and domain approval separation;
- award packets and purchase-order drafts that never award, purchase, or issue automatically;
- hash-chained audit, fingerprints, bounded retry, DLQ, API, CLI, PostgreSQL, five inactive n8n workflows, and Docker Compose.

## Distinction from Project 15

Project 15 is a generic multi-criteria decision engine. Project 18 implements the procurement lifecycle around evaluation: request controls, vendor and bid identity, submission deadlines, sealed scope, required documents, TCO, specialized agents, procurement conflicts, multi-role award review, and PO drafting. It reuses explainable scoring principles without pretending that scoring alone completes procurement.

## Trust boundary

All vendors, evidence, bids, screening results, scores, and outcomes are synthetic. `restrictedPartyStatus` is a fixture policy input, not a live sanctions check. A recommendation or recorded review never grants purchasing authority. This implementation does not contact vendors, negotiate, sign a contract, award a supplier, move money, or issue a purchase order.

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

`GET /health`, `GET /metrics`, and POST routes for `/plan`, `/evaluate`, `/conflicts`, `/review`, `/award-packet`, `/purchase-order-draft`, `/audit`, `/verify-audit`, `/retry`, and `/manifest`.

## Evidence boundary

Green tests prove deterministic implementation behavior only. They do not prove that the weights, policies, vendors, or recommendation are correct for a real procurement, that a real screening obligation was satisfied, or that the system is ready to handle confidential bids without organization-specific identity, encryption, segregation, legal review, and buyer controls.
