# Architecture

n8n owns authentication boundaries, orchestration, persistence calls, reviewer entry points, and retry scheduling. The dependency-free Node engine owns normalization, fingerprints, similarity, brand policy, scoring, risk inspection, state rules, funnel validation, and KPI math. PostgreSQL owns durable identities, provenance, evidence links, topics, decisions, backlog, performance, DLQ, and audit. Prometheus/Grafana expose local process counters. Optional source, model, publishing, and analytics adapters remain outside the trusted deterministic core.

The trust boundary is deliberate: source text can influence a score but cannot become an instruction. A future LLM may propose candidate labels or summaries, but deterministic controls still decide identity, policy flags, evidence coverage, and whether human review is mandatory.
