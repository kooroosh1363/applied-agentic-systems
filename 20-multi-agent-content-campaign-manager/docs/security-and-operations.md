# Security and operations

Brief, evidence, claim, and agent-objective text is scanned for prompt injection, secrets, payment-card-like values, and email-like PII. Evidence URLs require HTTPS. Campaign, version, asset, review, packet, and handoff fingerprints bind approvals to exact artifacts.

Production requires authenticated service identities, tenant isolation, RBAC/ABAC, key management, encrypted asset storage, retention and deletion controls, consent provenance, legal policy ownership, provider-specific rate limits, idempotent publishing, spend caps enforced by the advertising platform, and independent release authority. Delivery and ad-account credentials must not be exposed to creative agents.

Retries are capped at five attempts. DLQ items cannot replay automatically; operators must verify artifact versions, approvals, channel policy, and external side-effect state first. Monitor policy blocks, missing evidence, changed fingerprints, review latency, budget drift, handoff failure, retry exhaustion, and audit-chain verification.
