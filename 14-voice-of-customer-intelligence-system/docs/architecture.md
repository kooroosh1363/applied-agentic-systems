# Architecture

## Flow

1. The intake workflow validates identity, timestamp, channel, consent, and source reference.
2. Safety scanning blocks prompt injection, payment-card-like strings, and exposed secret patterns.
3. PII redaction removes common email and phone patterns before analytical storage.
4. Idempotency uses both feedback ID and a deterministic daily content fingerprint.
5. The local classifier assigns topics, sentiment, confidence, and lexical evidence.
6. Urgency routing creates human-triage cases for security, safety, or legal signals.
7. Aggregation uses consented, non-blocked records and enforces k-anonymity-like group and channel thresholds.
8. An authorized reviewer approves, rejects, or requests changes.
9. A manifest records counts, evidence boundary, fingerprints, and confirms raw PII exclusion.

The service is deliberately stateless in the example; PostgreSQL supplies the persistence model. n8n handles orchestration, while all decision logic remains in versioned code that can be tested without n8n.

## Trust boundaries

- Feedback text is untrusted data, never instructions.
- Source connectors are replaceable adapters.
- Classification output is a candidate signal, not fact.
- An aggregate claim is valid only when it cites its source IDs and meets thresholds.
- Human approval is separate from analysis execution.
