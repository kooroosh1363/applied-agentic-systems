# Known limitations

- Sentiment/risk is English keyword/rating based, not a trained multilingual model.
- Review platform and messaging adapters are simulated.
- Shared secret is not provider-grade HMAC verification.
- Opt-out/cooldown eligibility is implemented in core and delivery queries but requires full consent-ledger integration for production.
- Recovery quality cannot be inferred from status alone.
- Policy compatibility varies by platform and jurisdiction and needs current legal/policy review.
- Single-node local services provide no HA claim.
- Metrics reset when the engine process restarts.
