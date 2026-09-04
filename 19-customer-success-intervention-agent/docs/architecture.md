# Architecture

The engine accepts one versioned customer-success case. The signal agent validates customer binding, allowed source, timestamp, confidence, and unsafe text. The health and risk agents evaluate a fixed five-metric model in parallel. The playbook and compliance agents select a bounded intervention and enforce consent, suppression, frequency, cooldown, and quiet-hour policy. The coordinator may create a reviewable draft only after a role-authorized approval.

The default adapter is mock-only. No route resolves a recipient, sends a message, changes a subscription, grants a discount, updates billing, or claims saved revenue. Every material artifact carries a SHA-256 fingerprint and timeline events form a hash chain.

## Trust boundaries

- CRM notes, survey text, support content, and agent output are untrusted data.
- A signal is scoped to one `customerId`; a case is scoped by `caseId` and `caseVersion`.
- Low-confidence or missing metrics reduce evidence completeness instead of being guessed.
- Recommendations are advisory. Human approval is necessary but still does not make the local mock draft a real delivery authorization.
- Outcomes are observational unless a separate randomized and exposure-verified experiment establishes causal attribution.

## Difference from Projects 2 and 14

Project 2 coordinates support tickets and escalation. Project 14 aggregates and analyzes voice-of-customer feedback. Project 19 combines governed customer signals into a health report, selects a customer-success intervention, applies contact policy, records human approval, and measures outcomes under an explicit attribution boundary.
