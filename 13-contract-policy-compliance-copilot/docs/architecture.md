# Architecture and trust boundaries

The copilot separates policy governance from contract evaluation. A contract cannot introduce its own rules, and an unapproved or future policy cannot govern a report.

1. Contract intake validates identity, version, jurisdiction, clause identities and untrusted text.
2. Policy selection applies jurisdiction and effective-date filters and requires approved status plus an identified approver.
3. The conflict gate detects incompatible active rules for the same clause, requirement and field. It blocks instead of choosing silently.
4. The deterministic engine evaluates each applicable rule against structured clauses and terms.
5. Every finding carries policy-set, version, rule and clause citations.
6. The risk engine assigns a bounded score and decision.
7. Remediation is generated only as a draft and cannot alter the contract automatically.
8. Reviewer identity, role, decision and rationale are fingerprinted for audit.

Contracts, extracted clauses, policy payloads and model-generated suggestions are untrusted inputs. Approved policy identity and reviewer authorization are control-plane data.
