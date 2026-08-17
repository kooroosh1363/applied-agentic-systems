# Test plan

Automated tests cover normalization, invalid input, deterministic identity, email/phone/card redaction, explainable classification, safety escalation, retrieval order, auto-reply boundaries, unknown-topic escalation, state transitions, HTTP health/analyze/delivery/metrics behavior, workflow graph integrity, approval controls, bounded retry/DLQ controls, repository JSON parsing, secret-pattern scanning, and CI Compose rendering.

Local command: `npm run check` from the repository root. Docker runtime smoke testing requires Docker; GitHub Actions performs Compose configuration validation on every pull request.
