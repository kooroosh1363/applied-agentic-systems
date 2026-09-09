# Architecture

`Producer -> Signed ingest API -> Contract validation -> Dedup inbox -> Ordering gate -> Router -> Transactional outbox -> Worker -> Retry/DLQ -> Audit`

The public request is untrusted. Authentication establishes the tenant; the signature binds tenant, timestamp, and canonical event bytes. Duplicate producer IDs return the existing record. Sequence gaps and old sequences are quarantined. Accepted events create one delivery per matching subscription and an outbox record for durable publication.

The local engine uses memory for deterministic evidence. The SQL schema describes the persistence boundary but is not wired into the runtime adapter.
