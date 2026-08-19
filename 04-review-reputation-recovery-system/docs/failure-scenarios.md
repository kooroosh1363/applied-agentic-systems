# Failure scenarios

| Failure | Control | Outcome |
|---|---|---|
| Duplicate survey event | durable idempotency | no duplicate invite/case |
| Negative feedback | independent decisions | invite remains eligible and case opens |
| Customer opted out | eligibility rule | no invite |
| Service incomplete | eligibility rule | no invite |
| Safety/legal/fraud signal | risk evidence | human escalation |
| Repeated invite | 30-day cooldown | suppressed by consent policy, not rating |
| Provider 429/5xx | bounded backoff | retry or DLQ |
| Permanent delivery failure | classification | DLQ |
| Duplicate review webhook | provider event uniqueness | one verified event |
| Click without provider review | KPI rule | not counted as review |
