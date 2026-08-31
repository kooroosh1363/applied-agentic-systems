# Autonomous Sales Research Team

A bounded, auditable multi-agent research system that turns allowlisted public-source fixtures into an evidence-backed account brief for human review. The default path is deterministic, local, free, and explicitly simulated.

## What it demonstrates

- five specialized roles: coordinator, company researcher, evidence verifier, opportunity analyst, and brief composer;
- explicit agent-step and source budgets;
- agent and tool allowlists, source-domain allowlists, and HTTPS-only provenance;
- prompt-injection, sensitive-personal-data, direct-email, and phone-number blocking;
- claim-level citations, freshness checks, source-quality weighting, independent-source corroboration, and contradiction detection;
- immutable trace, brief fingerprint, review audit, export manifest, bounded retry, and manual DLQ replay;
- human approval without automatic outreach or CRM writes.

## Trust boundary

This project does **not** discover real prospects, enrich private contact data, send messages, or write to a CRM. The included company, domains, sources, and findings are synthetic. Approval confirms only that a human reviewed the brief; it does not authorize outreach.

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

API routes: `GET /health`, `POST /research`, `POST /review`, `POST /retry`, and `POST /export`.

## Structure

- `src/core.mjs` — validation, bounded orchestration, evidence verification, brief/review/manifest logic
- `workflows/` — five inactive n8n workflows ready for import
- `contracts/` — versioned research-request contract
- `database/` — PostgreSQL audit and state model
- `examples/` — an unmistakably synthetic research fixture
- `docs/` — architecture, methodology, safety, operations, and testing
- `tests/` — deterministic core, API, and workflow tests

## Evidence policy

`simulated` is the default and is carried through the brief and manifest. Changing a label does not prove real provider operation. Production evidence requires verified connectors, lawful collection, retention controls, source licensing, security review, monitoring, and documented human ownership.
