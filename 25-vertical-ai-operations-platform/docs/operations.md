# Operations, failure behavior and evidence

## State machine

`new -> suggested -> reviewed -> scheduled -> in_progress -> completed -> closed`.

Suggestion never sets the reviewed category. Scheduling requires reviewed state and a configured active technician with the confirmed skill. Interval conflicts are checked inside `BEGIN IMMEDIATE`, before writing the reservation. Adjacent reservations are allowed. Start requires the assigned, currently active/qualified actor and `starts <= now < ends`. Even after a reservation expires, an unfinished in-progress job blocks that technician from starting another job. Overruns require operational review; the system does not silently complete or extend them.

Cancellation releases a scheduled reservation but is forbidden after start. There is no reschedule command: before start, cancel and create/review a replacement explicitly. Completion and closure are allowed while paused, so operational records can still be reconciled. A supervisor cannot close work they personally completed, even if they have both roles. No notification, invoice, payment or external repair action occurs.

## Durable transactions and duplicates

Orders, audit and receipts commit in one SQLite transaction. Injected audit failure tests confirm no partial order/receipt survives. Failed commands are not cached; they can be retried after correcting the cause. Successful same-key commands return their original response, which may contain an older revision than current state. Use snapshot to get current state.

Receipts are scoped to tenant, actor and key; two actors using the same string have independent identities. Authentication and role checks occur before replay. Payload canonicalization sorts JSON object keys. Revision checks apply to new commands against existing orders. Pause commands are serialized last-write-wins tenant settings, with idempotent replay but no expected tenant generation; competing supervisors must coordinate. There is no automatic retry, DLQ or external provider reconciliation.

Storage errors return 503 and roll back any active transaction. SQLite write contention has a five-second busy timeout. HTTP has a ten-second socket timeout, not a strict total deadline. The single-threaded HTTP server is intended for local demonstration and can be delayed by a slow client; production ingress and a suitable server are needed.

## Persistence and recovery

Default database is `data/operations.db`; change with `OPERATIONS_DB`. Schema version 1 is checked on startup; unknown versions are rejected. Credentials/technician roster are trusted configuration outside the database. Credential rotation does not erase orders. A changed roster can prevent a newly started job, while an already assigned technician retaining their role can record completion.

Back up a quiescent database after stopping the API, or use SQLite's backup API; do not copy a database mid-write without a consistency mechanism. Store configuration securely separately. Test restore before operational use. This release has no backup UI, automated migration runner, retention deletion, archival or disaster-recovery SLA. Disk growth is unbounded by business quotas; monitor free space and receipt/audit growth. A disk-full error should fail the transaction rather than fabricate success.

## Signals and KPIs

Snapshot counts are exact counts of locally recorded statuses, not verified field outcomes. Audit records accepted commands with actor and timestamp. Rejections, request latency and admission rates have no built-in metrics export. No customer contact details, raw error strings or bearer tokens are written to audit; pseudonymous references still require a retention/access policy.

Useful future KPIs: intake-to-review time, schedule conflicts, review overrides, work overruns and closure lead time. There is no claimed SLA, revenue, model accuracy or productivity improvement benchmark. The example has no provider charges; host/storage costs for a real deployment remain the operator's responsibility.

## Verification

Run the Python suite or root `npm run check`. Root Node reports one wrapper test for this Python suite; do not mistake that wrapper for the number of Python test cases. The suite covers a real temporary SQLite database, reopening/replay, concurrent independent connections, injected transaction failure and local HTTP. It does not verify physical service, third-party systems, long-term durability under hardware failure, load limits or full security penetration coverage.

## Production backlog

Tenant quotas, paginated reads, immutable external audit retention, migration/restore drills, assignment history and rescheduling, monitored clock source, technician availability/leave, time zones at the UI, ingress rate limits/TLS, secret lifecycle, data retention and independent reviewer controls where required. For real AI: structured schema validation, evidence, timeout/idempotency contracts, evaluations and mandatory human decision boundaries. For external effects: transactional outbox and provider reconciliation. For multiple hosts: shared transactional storage and equivalent race tests before rollout.
