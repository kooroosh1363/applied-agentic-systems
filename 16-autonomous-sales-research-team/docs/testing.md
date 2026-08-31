# Testing

The suite covers request validation, domain/source/tool/agent allowlists, budgets, injection and personal-data blocking, provenance, citation integrity, source independence, freshness, confidence, contradiction detection, non-execution boundaries, role-based review, retry/DLQ, manifest fingerprints, API behavior, and importable inactive workflows.

Run project tests with `npm test` and repository-wide validation from the repository root with `npm run check`.

The local environment may not include Docker. GitHub Actions validates every Compose definition; a successful static Compose validation is not evidence that a real external provider was exercised.
