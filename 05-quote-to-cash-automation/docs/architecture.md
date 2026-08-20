# Architecture

n8n owns orchestration and human/provider boundaries. The dependency-free Node engine owns deterministic money, approval planning, state rules, reconciliation, delivery classification, and KPI math. PostgreSQL owns identities, quote versions, lines, approvals, acceptances, invoices, payment evidence, reconciliation exceptions, attempts, DLQ, and audit. Mailpit is the local document surface; Prometheus and Grafana expose counters. Real payment and accounting adapters remain outside the reference boundary.
