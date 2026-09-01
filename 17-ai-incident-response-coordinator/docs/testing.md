# Testing

Tests cover incident and signal contracts, safety scans, source allowlists, evidence confidence, signal windows, deduplication, correlation, severity levels, non-production caps, playbook identity and service scope, action budgets, risk and approval roles, non-execution, dispatch packets, timeline ordering and tamper detection, state transitions, communication drafts, postmortem and recovery gates, closure roles, retry/DLQ, manifest boundaries, API behavior, and importable inactive workflows.

Run `npm test` in this project or `npm run check` at repository root. Docker is not assumed locally; GitHub Actions validates every Compose definition. Static validation is not proof that real production connectors were exercised.
