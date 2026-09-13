# Design baseline: service operations vertical

## Business scope

A generic technical-service team receives a synthetic work request, obtains a bounded category suggestion, has a human reviewer confirm the category, schedules a qualified technician, records service completion and has a separate supervisor close the work. This portfolio example is independent of any customer-specific application or other repository.

## Invariants and acceptance criteria

- Tenant and actor derive from server credentials; request-supplied identities are rejected.
- Classification is a deterministic local mock over a controlled issue code; it is neither a trained model nor a diagnosis. Only a human review makes a work order schedulable.
- Each mutating command has a tenant/actor-scoped idempotency key. Same key and canonical payload replay the stored response, including after restart; different payload conflicts.
- Existing orders require the current revision. Replays are resolved before the revision check; a new stale command cannot overwrite newer work.
- Allowed lifecycle: new -> suggested -> reviewed -> scheduled -> in_progress -> completed -> closed. Cancellation is allowed only before start. Closure requires a supervisor distinct from the completing technician.
- Technician identity, active state and allowed skills come from trusted configuration. A transactional overlap check covers scheduled and in-progress work, including across separate database connections.
- Pause blocks scheduling and starting new work, but allows recording completion and closure. It does not cancel running work.
- Work order, idempotency receipt and audit write commit together or roll back together. No external side effects occur inside the transaction.
- All state is persisted in a local SQLite database. Startup rejects unknown schema versions. Multi-host deployment, external delivery and global execution guarantees are outside scope.

## Architecture

Python standard library, SQLite, command service, HTTP API and CLI demo. `BEGIN IMMEDIATE` serializes writes before overlap checks. Foreign keys, uniqueness constraints and checks complement application validation. Audit, receipts and orders share one transaction. A trusted token registry is reloaded on restart; only token hashes are retained in the service object.

## Limits

No actual AI provider, payment, inventory, invoicing, notification, route optimization, automatic scheduling, or integration with Projects 21–24. Technician reservations use caller-supplied integer UTC epoch seconds, not natural-language times. This demo is for operational workflow reasoning, not safety-critical dispatch. No customer personal data is required: only a pseudonymous customer reference and controlled issue code.
