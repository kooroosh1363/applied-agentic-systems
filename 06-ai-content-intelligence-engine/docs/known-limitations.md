# Known limitations

- The default path uses fixtures and deterministic candidate labels; it does not discover live trends or call an LLM.
- Token Jaccard similarity is explainable but weaker than multilingual semantic embeddings.
- English safety keywords and static brand themes are illustrative, not a complete policy engine.
- No automatic URL fetch, scraping, social publishing, asset generation, or revenue attribution is included.
- Shared secrets are not provider-grade signed webhooks; reviewer roles are not organization RBAC.
- Score weights are uncalibrated reference values and have no historical ranking benchmark yet.
- Single-node services, in-memory process counters, and local Mailpit make no HA or delivery claim.
- All example engagement and outcomes are simulated.
