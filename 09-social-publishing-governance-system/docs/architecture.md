# Architecture and data flow

The system accepts a publication request only when it names an approved `contentVersionId`, an immutable `assetVersion`, a channel, an intended time and UTM attribution. `publicationKey = SHA-256(contentVersionId:channel:assetVersion)` makes duplicate release attempts identifiable.

1. Intake validates the contract and records an immutable audit event.
2. Policy validation checks consent, disclosure, format/caption limits, prohibited targeting, unsafe claims, PII and prompt injection.
3. Passing work waits for brand review; regulated claims additionally require compliance review. Each approval is tied to a revision.
4. A publisher schedules only a fully approved revision. The scheduler blocks same-channel work inside its configured minimum interval.
5. The adapter returns a provider status. Only 429 and 5xx are retried, at most three attempts. Non-transient failures and exhausted retry become DLQ records.
6. Delivery evidence includes the provider status, attempt, revision and SHA-256 fingerprint. Provider-backed evidence is labelled separately from the local simulation.

The database is the intended source of truth. n8n is orchestration glue, not the durable approval ledger.
