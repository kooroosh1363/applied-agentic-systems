# Decision Intelligence & Recommendation Engine

A deterministic, local-first decision-support system that ranks alternatives using versioned criteria, verified evidence, hard constraints, explainable contributions, scenario analysis, sensitivity testing, and authorized human review.

## What it demonstrates

- weighted multi-criteria decision analysis with explicit maximize/minimize scales;
- evidence references and reliability adjustment for every measurement;
- hard constraints that disqualify an option instead of hiding violations inside an average;
- fail-closed behavior for missing evidence, no eligible option, one eligible option, or weak score separation;
- alternative weight scenarios and recommendation-stability analysis;
- protected-attribute criteria prohibition and stricter high-impact decision boundaries;
- human-only approval and explicit `autoExecute: false` on every recommendation;
- outcome feedback that records overrides without rewriting historical recommendations;
- deterministic fingerprints, safe manifests, bounded retry, outbox, DLQ, API, CLI, PostgreSQL, and five n8n workflows.

## Quick start

```bash
npm test
npm run demo
cp .env.example .env
docker compose up --build
curl http://localhost:8150/health
```

No paid API, cloud account, or payment card is required.

## Decision semantics

- `recommendation_ready`: at least two eligible options and a score gap at or above the declared threshold.
- `review_required`: evidence, competition, or score separation is insufficient.
- `human_review_required`: the domain is high impact or the declared risk is high/critical.
- `blocked`: no option satisfies both hard constraints and evidence completeness.

Even `recommendation_ready` requires a human decision owner; the engine never executes a recommendation.

## Local API

| Endpoint | Purpose |
|---|---|
| `GET /health` | Runtime and evidence boundary |
| `POST /evaluate` | Rank, constrain, explain, test sensitivity, and build manifest |
| `POST /scenario` | Evaluate an alternate approved weight set |
| `POST /review` | Record an authorized reviewer decision |
| `POST /outcome` | Record the chosen option and later metrics |

## Repository map

- `src/core.mjs`: contracts, scoring, constraints, scenarios, sensitivity, review, manifest, outcomes
- `examples/`: synthetic procurement and high-impact decision fixtures
- `contracts/`: JSON Schema for decision requests
- `workflows/`: five inactive importable n8n workflows
- `database/`: decision, evidence, scenario, review, outcome, outbox, and DLQ tables
- `docs/`: architecture, methodology, security, testing, and production limits
- `tests/`: deterministic core, API, and workflow gates

## Evidence boundary

All checked-in evidence and outcomes are synthetic and labeled `simulated`. The project proves system behavior and governance controls, not that the weights are correct for a real organization, that a recommendation causes a business result, or that the system may make regulated decisions without qualified human review.
