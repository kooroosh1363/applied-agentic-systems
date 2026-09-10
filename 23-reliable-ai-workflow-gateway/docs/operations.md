# Operations and validation

Run `npm test` in this directory, `npm run demo` for duplicate handling, and `npm run check` at repository root. Tests use mock adapters and controlled failures; they do not benchmark provider reliability or model quality.

Covered scenarios: invalid configuration/authentication/input; workflow denial; concurrent deduplication; payload conflict; replay isolation; cross-tenant keys; rate-window reset; concurrency admission; deadline with a still-active adapter; bounded safe retries; sanitized generic errors; output schema rejection; circuit opening and single recovery probe; fail-closed record capacity; HTTP authentication, malformed JSON, oversized body and success.

## Signals and response

For an embedded deployment inspect `gateway.audit`, `gateway.active`, `gateway.records` and `gateway.breakers`. There is no public metrics/admin endpoint. Track succeeded/failed/unknown outcomes, admission 429/503 counts, occupied slots and capacity utilization. Successful responses expose attempt counts; failed-attempt telemetry and histograms are future work. No DLQ exists, so do not report DLQ activity as implemented.

An unknown outcome requires operator/provider reconciliation before any new key is issued. Reusing its original key returns unknown. Do not restart merely to bypass limits: restart clears idempotency and can enable duplicate side effects with a real adapter. For record exhaustion, drain and archive/reconcile outcomes before a controlled restart in this demo. Production requires durable records, explicit retention, recovery and provider idempotency.

The local mock has no provider cost. No measured throughput, uptime or accuracy SLA is claimed. Useful production KPIs would include admission rejection rate, execution latency, unknown-outcome rate, duplicate suppression and reconciliation time; establish load-test baselines before setting targets.

## Production backlog

Durable transactional reservation store; tenant quotas; multi-replica admission coordination; provider request IDs and reconciliation; durable audit with retention; authenticated metrics; graceful draining; adapter isolation for stuck work; TLS ingress and slow-client protection; deadline-aware jittered backoff where safe; secret rotation; load/failure testing and pinned deployment artifacts.
