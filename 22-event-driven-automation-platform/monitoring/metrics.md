# Metrics

- `events_accepted_total`
- `events_deduplicated_total`
- `events_quarantined_total{reason}`
- `deliveries_succeeded_total`
- `deliveries_retried_total`
- `deliveries_dead_lettered_total`
- `delivery_lag_seconds`
- `outbox_unpublished`
- `audit_verification_failures_total`

Production labels must stay low-cardinality and must not include event payloads, event IDs, customer identifiers, or secrets.
