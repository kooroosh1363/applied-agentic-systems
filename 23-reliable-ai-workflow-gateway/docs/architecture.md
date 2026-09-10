# Architecture and contracts

HTTP authenticates before reading JSON, enforces a 16 KiB body cap, then calls the gateway. The gateway validates workflow permission and input, resolves an existing tenant/key reservation, checks capacity, circuit, concurrency and rate limits, and reserves the execution synchronously. The trusted adapter runs under a total deadline. The gateway validates its output, updates circuit state and appends a minimal audit outcome.

## Request and response

POST `/v1/execute` accepts exactly `workflow`, `key`, and `text`. Workflow is `classify-v1`. Keys contain 8–100 ASCII letters, digits, underscores or hyphens; text must be nonblank and at most 8192 UTF-8 bytes. Unknown fields, including caller-selected tenants, are rejected. Tenant and allowed workflows come from server configuration.

Success: HTTP 200 with `id`, `status: succeeded`, `result.label`, `attempts`, and evidence markers. Labels are support, sales or other. Failed execution: 502. Deadline: 504 with `status: unknown`. Admission errors: 400 invalid input, 401 credential, 403 workflow, 409 key conflict, 429 rate/concurrency, 503 capacity/circuit. Media type errors use 415 and oversized bodies 413. Responses disable caching.

The tenant and key identify a reservation; a SHA-256 fingerprint of workflow/text detects conflicts. Concurrent duplicates await one promise and receive cloned results. Replays do not consume another admission or create another audit event. Reservations remain for the process lifetime. Once 1000 records are reserved by default, new work fails closed rather than silently forgetting deduplication.

## Failure semantics

Default admission limits are two active operations per tenant and 30 new admissions in a 60-second fixed window. Windows allow boundary bursts; this is not a sliding-window or distributed limiter. Default deadline is 1000 ms for the entire operation.

Only a trusted adapter's typed `GatewayError('busy_before_execution')` is retried, at most two total attempts by default. This error promises no execution or side effect occurred. Retries are immediate; no exponential backoff is implemented. Generic failures and timeouts are not retried.

A deadline signals cancellation but cannot force an adapter to stop. The client receives unknown, its reservation keeps that result, and the slot remains occupied until the adapter settles. Late success is discarded. An adapter that never settles permanently consumes its slot. This intentionally favors limiting work over availability.

Each tenant/workflow circuit opens after three failures by default for 30 seconds. After cooldown one probe is admitted. Success closes it; failure reopens it. Circuit state reflects completion order, including already-admitted concurrent work; it is not a distributed provider health oracle.

## Trade-offs

All state is memory-only and lost on restart. Multiple replicas do not share limits, reservations or circuit state. There is no exactly-once guarantee across crashes, durable reconciliation, provider failover or arbitrary URL routing. UUIDs vary between demo runs; decision behavior is deterministic for fixture inputs. Structural validation does not establish semantic correctness or hallucination detection.
