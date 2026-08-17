# Known limitations

- Classification is English keyword-based and retrieval is lexical, not a trained model or vector search.
- The local knowledge set is intentionally small and versioning is manual.
- Channel adapters and delivery are simulated; OAuth, provider signatures, and rate limits are not provider-verified.
- Webhook shared-secret comparison is a demo control, not full HMAC verification.
- PostgreSQL and n8n run as single local instances; no HA or disaster-recovery claim is made.
- PII regexes reduce exposure but do not replace a formal DLP system.
- Dashboard counters reset when the engine restarts.
