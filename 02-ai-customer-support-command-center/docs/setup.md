# Setup

Requirements: Node.js 22 for deterministic tests; Docker Compose for the complete local stack. Copy `.env.example` to `.env` and replace the two local secrets. Run `npm test`, then `docker compose up --build`.

In n8n create a PostgreSQL credential named `Local Support Postgres` using host `postgres`, port `5432`, and the `.env` values. Import all files in `workflows/`. Start with `ticket-intake`; keep production activation disabled until secrets and credentials are configured.

Default services: n8n `5678`, engine `8082`, Mailpit `8025`, Prometheus `9090`, Grafana `3000`. No external account, credit card, or paid model is required.
