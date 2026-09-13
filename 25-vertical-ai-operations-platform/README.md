# 25 — Vertical AI Operations Platform

A durable local reference platform for a **technical-service operations** vertical: intake, bounded classification suggestion, human review, qualified technician scheduling, service recording and independent closure. This is the final project in the 25-project portfolio.

The AI-facing seam is a deterministic mock mapping controlled issue codes to categories. It is **not** a trained model, diagnosis, autonomous repair agent or production field-service SaaS. Every response explicitly marks local simulation and no external delivery.

## Run for free

Python 3.12+ and its standard library (including SQLite). No package installation, API key, paid service or cloud account.

```bash
python3 -B -m unittest discover -s tests -p 'test_*.py' -v
python3 -B src/demo.py
```

The demo uses a temporary database, reaches `closed` at revision 7, records seven audit events, reopens the database and verifies that the original intake key returns the same order ID. Its UUID is random; lifecycle decisions are deterministic.

To run a persistent API:

```bash
export OPERATIONS_CONFIG="$(python3 -B src/config_example.py)"
python3 -B src/server.py
```

This generates separate random tokens for intake, reviewer, dispatcher, technician, supervisor and viewer. The JSON contains secrets: keep it private and do not commit it. In a terminal retaining that configuration:

```bash
export OPERATIONS_TOKEN="$(python3 -c 'import os,json; print(next(c["token"] for c in json.loads(os.environ["OPERATIONS_CONFIG"])["credentials"] if c["actor"]=="intake"))')"
curl http://127.0.0.1:3025/v1/commands \
  -H "Authorization: Bearer $OPERATIONS_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @examples/create.json
```

For other commands choose the matching actor token. Preserve credential configuration securely if restarting with the same identities. Re-running the generator rotates all tokens; database state remains if the same database file is used.

## Commands

All requests contain exactly `action`, `key` and the fields below. Existing-order commands require `order_id` and `expected_revision` in addition to listed fields. Keys are 1–64 ASCII letters/digits/underscore/hyphen and are unique per tenant/actor.

| Action | Role | Additional fields |
| --- | --- | --- |
| create | intake | customer_ref, issue |
| suggest | reviewer | none |
| review | reviewer | category |
| schedule | dispatcher | technician, starts, ends |
| start | technician | none |
| complete | technician | completion_code |
| close | supervisor | none |
| cancel | dispatcher | none |
| pause | supervisor | paused (boolean); no order fields |

Issue codes: `cooling_fault`, `heating_fault`, `general_service`. Categories: `cooling`, `heating`, `general`. Completion codes: `service_recorded`, `inspection_recorded`; these are human attestations, not verified repair evidence. A reviewer may override the mock suggestion. Concurrency and reservations use UTC epoch seconds, half-open intervals `[starts, ends)`, and a maximum eight-hour reservation.

GET `/health` is public process liveness. GET `/v1/snapshot` requires viewer and returns tenant-scoped orders, persisted audit, pause state and counts. POST `/v1/commands` applies the command. There is no browser dashboard in this implementation.

## Docker

Set `OPERATIONS_CONFIG`, create `data`, and make that directory writable by container UID 1000 before `docker compose up`. On a Linux host, an operator may need to assign ownership to UID 1000. The service fails if the persistent directory is not writable. Source is read-only; the SQLite file and rollback journal share the writable data mount. Only localhost port 3025 is exposed.

Compose configuration validation is separate from running the container. See PR/CI evidence for exactly what was executed.

## Architecture and files

- `src/operations.py`: validation, roles, workflow state machine, transactions, replay and reads.
- `src/schema.sql`: version-1 SQLite schema, keys, checks and reservation index.
- `src/server.py`: bounded JSON HTTP API with a ten-second socket timeout.
- `src/demo.py`: complete synthetic workflow plus restart/replay.
- `src/config_example.py`: ephemeral credential configuration generator.
- `tests/test_operations.py`: domain, durable replay, atomic rollback, race and HTTP tests.
- `tests/python-suite.test.mjs`: includes the Python suite in the repository's Node test runner.
- `docs/design.md`, `docs/security.md`, `docs/operations.md`: invariants, boundaries and runbook.

No unused n8n workflows, PostgreSQL schema, live provider or integration with other projects is implied. This generic portfolio service does not import customer-specific rules from other repositories.
