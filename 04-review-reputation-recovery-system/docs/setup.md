# Setup

Use Node.js 22 for tests and Docker Compose for the local stack. Copy `.env.example` to `.env`, replace local secrets, run `npm test`, then `docker compose up --build`. In n8n create `Local Reputation Postgres` using host `postgres` and the `.env` values; import all four workflows. Default ports are n8n 5678, engine 8084, Mailpit 8025, Prometheus 9090, and Grafana 3000. No paid provider is required.
