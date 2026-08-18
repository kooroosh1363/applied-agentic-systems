# Failure scenarios

| Failure | Control | Outcome |
|---|---|---|
| Duplicate request | unique event key | no second booking |
| Concurrent same-slot requests | PostgreSQL exclusion constraint | one hold; other fails/waitlists |
| Hold never confirmed | expiring hold policy | slot becomes reusable |
| Reminder without consent | consent query | no message |
| Provider 429/5xx | bounded backoff | retry or DLQ |
| Permanent delivery failure | classification | DLQ |
| Cancellation | ranked expiring offer | next eligible waiter |
| Unverified no-show | attendance actor required | no recovery offer |
| Rebooking not completed | revenue rule | zero recovered revenue |
