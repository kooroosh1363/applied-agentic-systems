# Interview defense

## 60 seconds

This project is an ethical reputation recovery system, not a five-star review funnel. It normalizes post-service feedback, removes PII, and triages dissatisfaction or high-risk evidence for a human recovery case. Public-review eligibility is evaluated independently using service completion, opt-out, prior verified review, and cooldown—not sentiment. Therefore an eligible dissatisfied customer can receive the same neutral review invitation while a recovery case is opened in parallel; `reviewGatingApplied` remains false. Human resolution requires actor identity and an auditable code. Delivery has bounded retry and DLQ, while review KPIs count only provider-identified verified events, not clicks. The implementation is zero-cost and production-oriented, with real-provider, legal/policy, consent-ledger, RBAC, and load-test gaps documented.

## Hard questions

**Why not send the public link only to satisfied customers?** That is review gating and can mislead consumers or violate platform policy. Recovery and public-review choice must remain independent.

**Why use sentiment at all?** Only for recovery priority and safety escalation, never to suppress or alter the neutral public-review invitation.

**What proves a review occurred?** A unique provider event. A click, draft, or redirect is not counted as a review.

**Can resolved mean the customer is satisfied?** No. It means the case reached an operational resolution code; quality needs repeat-complaint and customer-confirmed outcomes.

**Is it production-grade?** It is production-oriented. Current provider policy/legal review, real signatures/adapters, consent ledger, RBAC, multilingual evaluation, load tests, backups, and SLO evidence remain required.
