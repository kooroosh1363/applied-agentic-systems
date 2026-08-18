# Setup

Use Node.js 22 for tests and Docker Compose for the local stack. Copy `.env.example` to `.env`, replace local secrets, run `npm test`, then `docker compose up --build`. In n8n create `Local Appointments Postgres` using host `postgres` and the `.env` database values; import all four workflows. Default ports: n8n 5678, engine 8083, Mailpit 8025, Prometheus 9090, Grafana 3000. No paid service is required.
