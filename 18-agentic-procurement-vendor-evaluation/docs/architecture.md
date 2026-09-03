# Architecture

The intake gate normalizes a versioned request, integer-money budget, deadline, country and document policy, weighted criteria, and execution budgets. The coordinator creates a fixed eight-step plan for sourcing, compliance, evidence, technical, commercial, risk, aggregation, and drafting. Agent and tool allowlists prevent arbitrary delegation.

Vendor and bid gates bind every submission to one request version and vendor identity. Evidence must include a supported type, HTTPS source, timestamp, status, and confidence. Compliance blocks missing documents and uncleared fixture status. Technical and commercial measurements must cite verified evidence. Hard constraints and budget failures disqualify a bid before ranking.

The output is a recommendation for human review. Required procurement, compliance, finance, and domain roles depend on risk and spend. Even complete reviews produce only an award packet with `awardAuthorized=false` and `purchaseAuthorized=false`. A later step can create a purchase-order draft, but `issued=false` and `autoIssue=false` remain invariant.

Audit events form a hash chain. Retry is bounded and exhausted work enters a DLQ with no automatic replay. PostgreSQL stores versioned artifacts and enforces non-award and non-purchase invariants with checks.
