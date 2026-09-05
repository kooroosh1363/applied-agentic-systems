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
| 02 | [AI Customer Support Command Center](02-ai-customer-support-command-center/) | Implemented |
| 03 | [Appointment & No-Show Recovery Engine](03-appointment-no-show-recovery-engine/) | Implemented |
| 04 | [Review & Reputation Recovery System](04-review-reputation-recovery-system/) | Implemented |
| 05 | [Quote-to-Cash Automation](05-quote-to-cash-automation/) | Implemented |
| 06 | [AI Content Intelligence Engine](06-ai-content-intelligence-engine/) | Implemented |
| 07 | [Multi-Format Content Production Studio](07-multi-format-content-production-studio/) | Implemented |
| 08 | [Content Repurposing & Localization Factory](08-content-repurposing-localization-factory/) | Implemented |
| 09 | [Social Publishing & Governance System](09-social-publishing-governance-system/) | Implemented |
| 10 | [Content Experimentation & Revenue Attribution](10-content-experimentation-revenue-attribution/) | Implemented |
| 11 | [Enterprise RAG Evaluation Platform](11-enterprise-rag-evaluation-platform/) | Implemented |
| 12 | [AI Quality Assurance & Hallucination Firewall](12-ai-quality-assurance-hallucination-firewall/) | Implemented |
| 13 | [Contract & Policy Compliance Copilot](13-contract-policy-compliance-copilot/) | Implemented |
| 14 | [Voice-of-Customer Intelligence System](14-voice-of-customer-intelligence-system/) | Implemented |
| 15 | [Decision Intelligence & Recommendation Engine](15-decision-intelligence-recommendation-engine/) | Implemented |
| 16 | [Autonomous Sales Research Team](16-autonomous-sales-research-team/) | Implemented |
| 17 | [AI Incident Response Coordinator](17-ai-incident-response-coordinator/) | Implemented |
| 18 | [Agentic Procurement & Vendor Evaluation](18-agentic-procurement-vendor-evaluation/) | Implemented |
| 19 | [Customer Success Intervention Agent](19-customer-success-intervention-agent/) | Implemented |
| 20 | [Multi-Agent Content Campaign Manager](20-multi-agent-content-campaign-manager/) | Implemented |
| 21-25 | See [portfolio roadmap](docs/portfolio-roadmap.md) | Planned |

## Quick validation

```bash
npm run check
```

Each implemented project can also be started locally with Docker. For example:

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
