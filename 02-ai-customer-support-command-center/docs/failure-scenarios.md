# Failure scenarios

| Failure | Detection | Control | Final state |
|---|---|---|---|
| Duplicate webhook | Unique idempotency key | Return duplicate without side effect | unchanged |
| Unknown or ungrounded request | low confidence/grounding | human escalation | escalated |
| Sensitive or safety content | term and urgency rules | never auto-send | escalated |
| Provider 429/5xx | HTTP status | exponential retry, maximum 3 | queued or DLQ |
| Provider 4xx | HTTP status | no blind retry | DLQ |
| Concurrent workers | row lock | `SKIP LOCKED` and unique attempt | one claim |
| Reviewer rejects draft | explicit action | audit and stop delivery | rejected |
