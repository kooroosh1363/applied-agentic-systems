# Architecture and trust boundaries

1. Intake validates decision identity, version, domain, risk, criteria, alternatives, constraints, and evidence.
2. Safety checks keep prompt injection and secret-shaped input out of the decision path and prohibit protected-attribute criteria.
3. Evidence validation resolves every measurement reference and discounts unverified or low-reliability sources.
4. Constraint evaluation disqualifies options before ranking.
5. Multi-criteria scoring normalizes each value against its declared scale and direction, then records weighted contribution.
6. The recommendation gate checks eligible-option count and minimum score separation.
7. Scenario and sensitivity analysis tests whether approved weight changes reverse the leader.
8. High-impact or high-risk decisions are forced to human review; every output has `autoExecute=false`.
9. Reviewer identity, role, rationale, outcome, and fingerprints are stored separately from the original recommendation.

n8n orchestrates events, while versioned code owns decisions. PostgreSQL models durable history. External evidence connectors are replaceable adapters and their payloads remain untrusted.
