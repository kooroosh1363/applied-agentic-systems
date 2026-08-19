# Architecture

n8n owns orchestration; the dependency-free Node engine owns deterministic normalization, redaction, risk triage, eligibility, no-gating policy, delivery classification, and KPI math; PostgreSQL owns event identity, feedback, neutral invites, recovery cases, verified review events, attempts, DLQ, and audit; Redis is reserved for future queue scale; Mailpit is the local delivery surface; Prometheus and Grafana expose counters. Invite eligibility and recovery triage remain separate policy decisions.
