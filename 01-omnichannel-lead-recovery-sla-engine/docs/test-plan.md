# Test Plan

## Deterministic automated tests

| Area | Cases |
|---|---|
| Normalization | trimming, lowercase email, normalized phone, timestamp |
| Validation | unsupported channel, missing contact, invalid shape |
| Idempotency | stable same-event key, different-event key |
| Scoring | high/medium/low boundaries and reasons |
| Safety | emergency handoff, overdue handoff, consent block |
| Provider | success, 429, 422, timeout, invalid request, metrics |
| Workflow | JSON parsing, unique nodes, required boundaries, valid connections |
| Repository | required artifacts, every JSON parse, basic secret patterns |

## CI-only validation

GitHub Actions runs `docker compose config --quiet`. The current execution environment used to author the project did not provide Docker, so container startup is not claimed until the CI run supplies that evidence.

## Future real-provider tests

External sandbox tests require owned accounts and credentials. They are intentionally optional and must be labeled `external sandbox`, never `production`.

