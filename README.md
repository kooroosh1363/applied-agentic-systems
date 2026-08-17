# Applied Agentic Systems

> 25 production-oriented projects in reliable automation, AI decision systems, multi-agent operations, and platform engineering.

[![Quality](https://github.com/kooroosh1363/applied-agentic-systems/actions/workflows/quality.yml/badge.svg)](https://github.com/kooroosh1363/applied-agentic-systems/actions/workflows/quality.yml)

This repository is the advanced continuation of [Agentic Automation Lab](https://github.com/kooroosh1363/agentic-automation-lab). Each project is designed as a reproducible engineering system rather than a collection of screenshots or disconnected workflow exports.

## Engineering contract

Every project must provide evidence for its claims:

- importable workflows or executable implementation;
- sample data, data contracts, and deterministic tests;
- idempotency, retry, dead-letter handling, and failure scenarios where relevant;
- architecture, security, observability, cost, KPI, and limitation documentation;
- a zero-cost local path with mock adapters for external providers;
- explicit labels for simulated evidence versus real provider evidence.

`Production-oriented` describes the demonstrated engineering patterns. It does not claim that a project has been operated in a customer production environment.

## Progression

| Level | Projects | Theme |
|---|---:|---|
| Commercial Automation Systems | 01-05 | End-to-end business processes, state, SLA, and recovery |
| Revenue & Content Operations | 06-10 | Content operations, governance, experimentation, and attribution |
| AI Decision & Knowledge Systems | 11-15 | RAG evaluation, AI safety, explainable decisions, and feedback |
| Agentic Operations | 16-20 | Bounded tool use, specialized agents, verification, and approval |
| Platform Engineering | 21-25 | Multi-tenancy, event-driven systems, gateways, control planes, and vertical platforms |

## Projects

| # | Project | Status |
|---:|---|---|
| 01 | [Omnichannel Lead Recovery & SLA Engine](01-omnichannel-lead-recovery-sla-engine/) | Implemented |
| 02 | AI Customer Support Command Center | Planned |
| 03 | Appointment & No-Show Recovery Engine | Planned |
| 04 | Review & Reputation Recovery System | Planned |
| 05 | Quote-to-Cash Automation | Planned |
| 06-25 | See [portfolio roadmap](docs/portfolio-roadmap.md) | Planned |

## Quick validation

```bash
npm run check
```

Project 01 can also be started locally with Docker:

```bash
cd 01-omnichannel-lead-recovery-sla-engine
cp .env.example .env
docker compose up --build
```

No paid API is required for the default path.

## Evidence policy

Benchmarks generated from fixtures are marked `simulated`. Real customer revenue, conversion, or provider-delivery claims are never inferred from synthetic data. See [Evidence Policy](docs/standards/evidence-policy.md).

## License

MIT

