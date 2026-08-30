# Security, governance, and operations

## Controls

- Decision text and evidence claims are untrusted input.
- Prompt-injection and exposed-secret patterns block evaluation.
- Protected attributes are prohibited as criteria.
- Employment, credit, housing, insurance, healthcare eligibility, and education admission remain decision-support-only domains.
- High-impact and high/critical-risk recommendations require human review.
- A blocked report cannot be approved.
- A domain expert alone cannot approve a high-risk recommendation; a decision owner or risk reviewer is required.
- Outcomes never rewrite the historical recommendation.
- Exports include fingerprints and never trigger execution.
- Delivery uses bounded retry, outbox, and DLQ.

Production deployment also needs authenticated evidence ingestion, tenant isolation, policy-owner approvals for weights and constraints, signed model versions, separation of duties, access reviews, retention/deletion, encryption, rate limits, immutable audit storage, bias evaluation, appeal and override procedures, and incident response.

Monitor missing evidence, constraint failures, score-gap distribution, sensitivity instability, reviewer overrides, outcome coverage, stale evidence, policy-version skew, retry rate, and DLQ depth.
