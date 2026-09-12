# Design contract (implementation baseline)

## Business requirement

An operator must be able to govern which immutable workflow revision is desired, distinguish that intent from worker-observed state, and stop new work without claiming already-running work was cancelled.

## Invariants

1. Identity and tenant come from configured credentials, never request payloads.
2. Author, reviewer, operator, viewer and worker permissions are checked on every call. An author cannot approve their own revision, even with two credentials for that identity.
3. Revisions are immutable; approval binds their canonical configuration digest. Rollback selects a previously activated, approved revision.
4. All mutations require the current aggregate generation. Each accepted mutation increments it once. A retry with an old generation conflicts instead of repeating the mutation.
5. Activation changes desired state, not observed state. Only a worker acknowledgement for the exact current generation and digest records convergence.
6. Pausing immediately prevents local resolution for new work. Resuming or rollback requires a fresh acknowledgement. Older acknowledgements cannot undo an operator change.
7. A worker must acknowledge healthy status within the freshness window before local resolution is allowed. Unknown/unhealthy/stale/mismatched state fails closed.
8. Reads return copies. Internal state and raw credentials are not exposed through the API. No arbitrary code, URL, secrets or prompts are accepted as workflow configuration.

## Architecture and scope

Single-process Node.js control service; dependency-free API and CLI; private in-memory registry and audit. The worker in the demo is simulated. There is no external deployment controller, database, message broker, direct integration with Project 23, or cancellation of running work. Production would require durable transactional state, outbox delivery, worker identity/leases and distributed admission fencing.

## State model

Each tenant/workflow has generation, immutable revisions, desired revision, paused flag, observed acknowledgement and activation history. Configuration is exactly adapter=local-classifier-v1 and concurrency=1..10. Revisions are sequential integers. All accepted mutations invalidate old observation by advancing generation. Drafting or reviewing a revision therefore conservatively requires acknowledgement again even when the active revision stays the same.

A paused desired state can be acknowledged, but cannot resolve work. An unhealthy observation prevents resolution. Successful resolve is a local admission snapshot, not a durable execution permit; pause cannot revoke a previously returned snapshot. A real worker must use admission fencing and check again at dispatch.

## Acceptance tests

Credential and cross-tenant isolation; role separation and self-approval denial; immutable copies; approval before activation; compare-and-swap conflicts; stale acknowledgement and digest rejection; healthy convergence; exact TTL boundary; pause/resume safety; rollback history; bounded storage; HTTP authentication, validation and status mapping; no external-delivery claims.
