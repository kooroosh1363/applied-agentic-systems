# Setup

Requirements: Docker Compose, or Node.js 22 for deterministic tests. Copy `.env.example` to `.env`, replace local secrets, and run `docker compose up --build`. Open n8n on port 5678, import the six JSON workflows, and create a PostgreSQL credential named `Local Content Postgres` using host `postgres`, port `5432`, and the `.env` database values. Mailpit is at 8025, Prometheus at 9090, and Grafana at 3000. Fixtures use only `example.test`; no account, card, model key, or live social connector is needed.
