# Threat model

Assets include customer messages, identifiers, reply authority, credentials, and audit evidence. Threats include forged webhooks, replay, prompt-like instructions inside tickets, PII leakage, unauthorized approval, duplicate sends, credential exposure, and log over-retention.

Implemented controls: shared-secret ingress check, provider-event uniqueness, local corpus grounding, no ticket-driven tool execution, PII redaction, explicit reviewer identity, immutable-style audit inserts, isolated environment variables, bounded payload size, and secret scanning. Production gaps: replace shared secrets with provider signature verification, enforce RBAC/SSO and tenant isolation, encrypt sensitive columns, define retention/deletion, add network policies, and centralize security logs.
