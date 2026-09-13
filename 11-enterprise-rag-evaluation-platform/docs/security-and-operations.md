# Security and operations

This is a trusted single-user, loopback workbench. It is not a public multi-tenant service.

- Bind is 127.0.0.1 by default; Docker publishes to host loopback only.
- Host allowlist and same-origin checks reduce DNS-rebinding/CSRF risk. POST routes require an ephemeral UI token or an operator-configured API token. Tokens do not provide user identity or roles.
- Request bodies are limited to 64 KiB, with a single active evaluation. Dataset sizes, candidate settings and claim counts are bounded.
- HTTP cannot inject datasets, gold labels, arbitrary ranked documents, release thresholds or safety bypasses.
- HTML renders user-controlled strings escaped; CSP blocks external scripts and frames. CSV formula prefixes are escaped. No raw model HTML is rendered.
- Ollama endpoints must be loopback HTTP, with a 30-second per-call timeout, no redirects and a 2 MB response cap. Many-case model runs can take minutes. No automatic retries hide unknown outcomes.
- Only synthetic documents are bundled. General-purpose PII detection, identity authorization, encryption at rest and audit nonrepudiation are not implemented.

## Storage

Local reports live under `data/` (or `P11_DATA_DIR`) and are excluded from git. JSON checksums detect accidental tampering but are not cryptographic authenticity: a local administrator can replace the checksum too. Back up the directory while no runs are active. Local atomic files are intended for one process on a local filesystem, not shared network storage.

PostgreSQL stores the same complete report and checksum through parameterized statements. Configure `DATABASE_URL` only after installing optional dependencies and applying the additive migration. Duplicate UUIDs must fail. Multiple dataset versions coexist. Back up the database with normal PostgreSQL procedures. Do not expose the sample database password to a public network.

`/metrics` exposes process-local completed/failed counters and active state. Prometheus must run separately using `monitoring/prometheus.yml`; it is not bundled into the default stack. These counters reset on restart. No cost estimation or token counts are fabricated.

## n8n

Exports remain inactive reference integrations. Workflows read real reports from the shared API; they do not calculate a competing release policy. Configure a strong P11_API_TOKEN, EVALUATOR_URL and network reachability. Native n8n import/execution requires separate validation on your installed version.

## Before production

Independent dataset review/holdout, measured model calibration, stronger identity/access control, tracing, rate limits, queueing, cancellation, backup recovery exercises and operational load tests remain deployment work. Never describe this local reference as production-proven.
