# Setup

Use Node.js 22 and Docker Compose. Copy `.env.example` to `.env`, replace local secrets, run `npm test`, then `docker compose up --build`. In n8n create `Local Quote Postgres` with host `postgres` and the `.env` database values; import all six workflows. Default ports are n8n 5678, engine 8085, Mailpit 8025, Prometheus 9090, and Grafana 3000. No paid provider is required.
