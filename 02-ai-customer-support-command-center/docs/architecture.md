# Architecture

The orchestration plane is n8n; PostgreSQL owns durable state and uniqueness; Redis is available for local queue expansion; the dependency-free Node service owns deterministic classification, local knowledge retrieval, PII removal, routing, delivery simulation, and metrics. Human decisions are separate authenticated workflow events and append audit evidence. Prometheus scrapes counters and Grafana presents them.

The boundary is deliberate: workflow JSON expresses integration and state transitions, while pure functions remain directly testable. A real provider adapter can replace `/v1/deliver` without changing ticket state semantics.
