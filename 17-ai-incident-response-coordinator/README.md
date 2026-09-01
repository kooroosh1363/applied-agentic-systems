# AI Incident Response Coordinator

A deterministic, local-first coordinator for incident triage, evidence correlation, versioned playbooks, human-approved response proposals, hash-chained timelines, reviewed communications, recovery evidence, and postmortems.

## What it demonstrates

- canonical incident and signal contracts with provenance and deduplication;
- deterministic SEV1-SEV4 classification from verified, high-confidence evidence;
- bounded correlation windows and versioned, service-scoped playbooks;
- risk-aware response plans where every action has `autoExecute: false`;
- role-gated approval and dispatch packets that still require an authorized operator;
- append-only hash-chained timelines and tamper detection;
- communications drafts that are never auto-published;
- controlled state transitions, recovery-evidence gates, postmortems, corrective-action owners, bounded retry, and DLQ;
- five inactive n8n workflows, PostgreSQL, API, CLI, Docker Compose, synthetic fixtures, and deterministic tests.

## Trust boundary

This reference implementation does not connect to real infrastructure, isolate hosts, restart services, rotate credentials, block indicators, publish status updates, or close incidents automatically. A recorded approval is not execution authorization. The default fixture and all outcomes are explicitly `simulated`.

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

No paid API or cloud account is required.

## API

`GET /health` and POST routes for `/triage`, `/approve-action`, `/dispatch`, `/timeline`, `/verify-timeline`, `/status-draft`, `/postmortem`, `/close`, `/retry`, and `/manifest`.

## Evidence boundary

Green tests demonstrate implementation behavior only. They do not prove response quality in a real incident, safe execution against production infrastructure, legal compliance, or operational readiness without authenticated integrations, access controls, rehearsals, monitoring, and accountable human owners.
