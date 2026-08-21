# Failure scenarios

| Failure | Control | Outcome |
|---|---|---|
| replayed source event | source-scoped idempotency | one signal |
| malformed or non-HTTP URL | contract/core validation | rejected |
| duplicated topic phrasing | token similarity + merged evidence | one candidate group |
| unsupported claim | provenance and evidence score | lower score/review |
| prompt injection in source | untrusted-data inspection | penalty + human review |
| excluded brand theme | policy block | rejected |
| unauthorized approval | reviewer role check | rejected |
| duplicate analytics event | channel/event identity | counted once |
| clicks exceed impressions | funnel invariant | rejected |
| delivery 429/5xx | bounded backoff | retry then DLQ |
| model/source unavailable | deterministic local baseline | system remains testable |
