# Security and operations

## Security controls

- Only approved, identified policy versions can govern a report.
- Conflicting active rules block automated conclusions.
- Contract text is scanned as untrusted input for selected injection, secret and sensitive-data patterns.
- Critical/high reports require a legal reviewer, not a general business role.
- Remediation proposals are explicitly draft, human-gated and never auto-applied.
- Report, version-diff and review fingerprints make later changes detectable.
- Fixtures contain no real customer contracts or credentials.

## Production additions

Add identity-provider integration, tenant isolation, field-level access, encrypted storage and transport, a secrets manager, legal-hold and deletion workflows, privilege labels, signed policy releases, durable queues, immutable audit retention, rate and size limits, reviewer separation of duties, incident response and regional data controls.

Monitor policy-version skew, conflict blocks, critical/high finding rates, reviewer backlog and SLA, remediation acceptance, extraction confidence, false-positive drift and report-fingerprint mismatches.
