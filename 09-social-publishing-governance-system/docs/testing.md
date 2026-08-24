# Testing and failure injection

`npm test` executes deterministic unit and workflow checks. Covered cases include missing consent, unsupported channels, duplicate UTM markers, disclosure, prohibited claims, PII, approval matrix, permission boundaries, approval invalidation on reschedule, schedule collision, past dates, transient retry, permanent DLQ, and evidence labels.

Failure injection is local and deliberate:

- use `examples/prohibited-claim-post.json` to verify policy failure;
- submit two approved LinkedIn records less than 120 minutes apart to verify rate guardrails;
- return status 429/500 to test retry and status 422 or a third 500 to test DLQ;
- change an approved record's time to prove that its approval set is cleared.

The test suite proves code behavior with fixtures; it does not test external social-platform APIs or prove delivery.
