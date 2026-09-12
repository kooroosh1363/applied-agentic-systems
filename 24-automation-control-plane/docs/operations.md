# Operations and evidence

## Lifecycle

Propose creates immutable revision 1, generation 1, paused=true. A different actor approves it at generation 1, yielding generation 2. Operator activates at 2 and resumes at 3. Worker acknowledges the selected digest at 4; resulting healthy observation is generation 5. Resolve returns revision/config only while enabled, converged and fresh. Pause at 5 yields 6 and blocks new local resolution immediately.

Rollback selects an approved revision that appeared in activation history. It changes desired state and requires a new worker acknowledgement; it does not undo already-executed effects. Activation history records operator selections, not proof of real deployments. Activation and rollback preserve pause. Resume is always a separate command.

## Conflicts, duplicates and failures

All commands use compare-and-swap generation; a duplicate old command returns 409. No response replay cache exists. If the client loses a response, read state/audit and reconcile before deciding whether a new command is needed. There is no automatic retry or DLQ. HTTP has no execution worker timeout because mutations are synchronous in-process operations; slow-client protections belong at ingress.

Status codes: 400 invalid contract, 401 unknown credential, 403 role/self-approval denial, 404 missing workflow/revision/route, 409 stale generation or lifecycle conflict, 413 oversized body, 415 media type, 423 paused, 503 stale/unhealthy/unconverged observation or capacity failure. `/health` only reports that the HTTP process is running.

Observation freshness defaults to 30 seconds; age >= TTL or a backwards clock fails closed. Workers must refresh by reading current generation and acknowledging. Every mutation, including a new draft or approval, invalidates previous observation. This conservative aggregate version design can reduce availability during authoring. Separate spec and observation versions are a future design option requiring equivalent stale-write tests.

## Monitoring and limits

Viewer audit exposes accepted changes with sequence, tenant, actor, workflow, action, generation and timestamp. Read endpoints do not expose tokens. Rejected actions and resolve attempts are not logged; admission/denial counters, latency histograms and an authenticated metrics endpoint are future work. Audit is in memory, not durable or tamper-proof.

Defaults: 100 workflows globally, 100 revisions per workflow, 10000 accepted changes globally; no silent eviction. Audit exhaustion blocks mutations and local resolution. It therefore stops new admitted work, including when no further pause command can be recorded. Frequent worker acknowledgements consume this finite budget; this is a bounded demonstration, not a long-running production store. One tenant can exhaust shared capacity; production needs per-tenant quotas and durable retention.

Restart loses configuration, approval, audit and desired/observed state. Start from a trusted reviewed configuration process; there is no restore/import endpoint. Do not treat restart as safe incident recovery for a real deployment. No real deployment or live side-effect cancellation is implemented.

## Validation and cost

Run `npm test` here and `npm run check` at repository root. Demo runs without network, paid API or model. Tests exercise mock workers, generation races and HTTP with local sockets. CI checks Node tests and Compose configuration; configuration validation is not Docker runtime, load or penetration testing.

Useful future KPIs: desired-to-observed convergence latency, stale observation rate, conflicts, denied admission and emergency pause propagation time. No benchmark targets, model accuracy or revenue results have been measured.

## Production priorities

Transactional durable state with compare-and-swap; outbox/event transport; independently authenticated workers and per-worker observations; dispatch-time fencing; graceful draining; revocation and credential rotation; durable audit and retention; tenant quotas and ingress limits; signed artifacts and provenance; deployment acknowledgements linked to actual runtime evidence; load/failure testing. A previously issued local resolution cannot be revoked by pause, so dispatch-time enforcement is essential.
