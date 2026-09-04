# Security, privacy, and operations

Prompt-injection phrases, secret-like values, and payment-card-like strings are blocked. Email- and phone-like text is detected for redaction. Detection is defense in depth, not a complete data-loss-prevention system.

Production deployment needs authenticated service identities, tenant isolation, field-level authorization, encryption in transit and at rest, secret management, retention and deletion policy, consent provenance, regional processing controls, audit export, abuse monitoring, and incident response. CRM and billing scopes should be read-only for evaluation. Delivery credentials must live in a separate service and require an approved execution envelope.

The sample checks quiet hours using UTC because it intentionally has no timezone library. A real adapter must evaluate the customer's verified IANA timezone, daylight-saving changes, locale, holidays, and channel-specific law before contact.

Retries are capped at five attempts with exponential backoff. Exhausted jobs enter a DLQ and cannot replay automatically. Operators should investigate the cause, confirm case version and consent freshness, then authorize a new job rather than mutating history.
