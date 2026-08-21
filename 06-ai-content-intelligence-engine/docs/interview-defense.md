# Interview defense

## 60 seconds

This is a content intelligence system, not a caption generator. It accepts versioned signals from audience, search, support, sales, competitor, and trend sources; authenticates, normalizes, deduplicates, and preserves provenance. A deterministic engine groups similar topics and produces an explainable 100-point score across demand, brand fit, evidence quality, freshness, and business alignment. Source text is untrusted data, so prompt injection and sensitive claims add penalties and force human review; excluded themes are blocked. Only an identified reviewer can approve a topic for the backlog. Performance events are idempotent, must satisfy funnel invariants, and simulated outcomes never enter verified KPIs. The local path is free and testable; real connectors, multilingual evaluation, RBAC, scale, and business evidence remain production work.

## Hard questions

**Why call it AI if the default path is deterministic?** AI is optional for candidate extraction and summarization. The portfolio proves the controls that must surround a model, while the free baseline remains reproducible and does not fake an API integration.

**How do you stop prompt injection from a competitor page?** Source text is stored and scored as data, never concatenated into privileged instructions. Detection forces review; a production model adapter would use structured outputs, least-privilege tools, and separate policy enforcement.

**Why not rank only by engagement?** Engagement is noisy, gameable, platform-specific, and may be simulated. The score balances first-party demand, independent evidence, brand fit, freshness, and business priority.

**How do you prove a topic caused revenue?** This project does not. It records verified performance facts; causal revenue attribution needs controlled experiments, stable identities, consent, conversion windows, and an attribution model.

**What would you evaluate before adding embeddings or an LLM?** A versioned multilingual dataset with duplicate pairs, relevant topics, policy violations, and reviewer labels; then precision/recall, ranking quality, calibration, latency, cost, and regression tests.

**Is it production-grade?** It is production-oriented. Real lawful connectors, signed events, source snapshots, RBAC, PII controls, calibrated evaluation, scale, backups, and SLO evidence are still required.
