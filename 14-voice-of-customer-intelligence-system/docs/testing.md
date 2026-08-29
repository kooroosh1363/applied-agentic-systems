# Testing

Run project tests with `npm test` in this directory and the full repository gate with `npm run check` at repository root.

The suite covers contract validation, supported channels, timestamps, PII detection/redaction, prompt injection, secret/card blocking, exact and content deduplication, English/Persian topic signals, sentiment, lexical evidence, urgency, no automatic contact, consent exclusion, minimum group size, source diversity, evidence citations, deterministic fingerprints, trend deltas, authorized review, safe manifests, API behavior, workflow importability, human approval, bounded retry, and DLQ.

Fixtures are synthetic and results remain `simulated`. Docker Compose should also be run in an environment with Docker installed; passing static repository tests alone is not evidence of a running container stack.
