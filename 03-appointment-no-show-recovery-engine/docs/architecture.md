# Architecture

n8n owns orchestration; the dependency-free Node engine owns deterministic domain policy; PostgreSQL owns event identity, calendar exclusion, lifecycle state, waitlist, attendance, retries, DLQ, and audit; Redis is reserved for future queue scale; Mailpit provides local delivery evidence; Prometheus and Grafana expose counters. Calendar correctness is enforced in the database, not only by a pre-check that can race.
