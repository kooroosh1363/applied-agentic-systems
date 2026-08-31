# Security and operations

## Controls

- least-privilege agent and tool allowlists;
- per-request source-domain allowlist and HTTPS-only URLs;
- prompt-injection and sensitive/direct-contact-data screening;
- bounded steps, sources, retries, and backoff;
- no shell, browser automation, outbound messaging, or CRM mutation tool;
- immutable fingerprints and reviewer-role checks;
- no automatic DLQ replay.

## Operations

Monitor blocked requests, unsafe-source findings, stale/withheld claims, contradictions, step-budget exhaustion, retry exhaustion, review latency, and fingerprint mismatches. Rotate credentials for any future connectors, isolate tenants, encrypt data, and apply source-specific retention and licensing rules.

For production, replace fixtures with contract-tested read-only adapters, add SSRF protections and DNS/IP validation, malware scanning, per-tenant encryption, access reviews, deletion workflows, and external security assessment.
