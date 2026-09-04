# Testing

Run `npm test` inside this directory or `npm run check` at repository root. Tests cover required fields, customer and signal binding, timestamps, source allowlists, confidence, unsafe content, agent and tool budgets, deterministic scoring, missing evidence, risk drivers, consent, do-not-contact, legal hold, contact frequency, cooldown, quiet hours, healthy-customer suppression, finance review, approval binding, unsent mock drafts, observational outcomes, hash-chain tamper detection, retry/DLQ, API errors, and importable inactive workflows.

The test suite uses only local fixtures and Node's built-in test runner. It makes no external provider call. Docker Compose validation in CI checks the declared topology; actual production integrations remain out of scope.
