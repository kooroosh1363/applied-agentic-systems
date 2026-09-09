# Testing

`node --test` covers valid and invalid contracts, nested-payload signature tampering, stale signatures, scopes, tenant isolation, producer deduplication, quota, ordering gaps, old sequences, worker authorization, terminal-state immutability, bounded retries, DLQ approval, audit tamper detection, HTTP validation, security headers, and workflow import shape.

The demo is deterministic and does not prove external broker delivery or a running PostgreSQL/Compose stack.
