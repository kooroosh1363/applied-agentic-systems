# Setup

## Requirements

- Docker Engine with Compose v2
- 4 GB free memory recommended
- ports 3000, 5432 (internal only), 5678, 6379 (internal only), 8025, 8080, and 9090 available

## Start the stack

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
```

Create a PostgreSQL credential in n8n:

| Field | Value |
|---|---|
| Host | `postgres` |
| Database | value of `POSTGRES_DB` |
| User | value of `POSTGRES_USER` |
| Password | value of `POSTGRES_PASSWORD` |
| Port | `5432` |
| SSL | disabled for this local network only |

Name it `Local Leads Postgres`, import `workflows/lead-intake.json`, select the credential on both PostgreSQL nodes, and activate the workflow.

## Stop

```bash
docker compose down
```

To remove only this project's local data after confirming it is disposable:

```bash
docker compose down --volumes
```

Do not reuse the example passwords outside the isolated local environment.

