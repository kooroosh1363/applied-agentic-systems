# Security and Operations

Request, vendor, evidence, and agent-objective text are scanned for prompt injection, exposed secrets, and payment-card-like values. Vendor and evidence URLs require HTTPS. Agent and tool allowlists, step budgets, vendor budgets, bid deadlines, version binding, source identity, confidence thresholds, and integer-money validation reduce uncontrolled behavior.

Production still requires authenticated service identities, RBAC, bid encryption, tenant isolation, sealed storage, key management, access logging, retention and deletion controls, dual control, real sanctions and beneficial-ownership integrations, legal policy ownership, vendor consent, and independent purchasing authority. Confidential proposals must never be placed in model prompts without approved handling.

Monitor request and bid rejection rates, missing evidence, compliance blocks, conflicts, single-bid decisions, narrow score gaps, reviewer latency, changed fingerprints, audit-chain failures, retry exhaustion, DLQ size, and draft-to-issued handoff outside this coordinator.

The conflict detector surfaces shared identifiers or identical bid components only as review signals. It does not establish fraud or collusion. Investigation and legal conclusions remain human responsibilities.
