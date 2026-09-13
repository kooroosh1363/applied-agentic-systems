# Testing

`npm test` runs deterministic tests without dependencies. Cases reproduce v1 defects: false 999-day support, duplicate ranking inflation, unknown/unauthorized ranked sources, duplicate case identity, invalid baseline numbers and incorrect block aggregation. API tests cover shared regression, persistence/exports, CSRF/Host checks, oversized input and configuration overrides. Metric invariants are checked across rank permutations.

Adapter tests use deliberately labeled network stubs to verify request/response contracts and failure behavior. They do not establish model quality. The PostgreSQL unit adapter test only checks query contracts; the separate `npm run test:postgres` must run against PostgreSQL 16 for integration evidence.

`npm run evaluate` executes the full synthetic set. `node src/cli.mjs --fault` must produce blocked and exit 1. `npm run ablation` runs four actual candidate variants. Detailed JSON is written to ignored `artifacts/`.

Browser validation covers clean evaluation, wrong-number injection, evidence inspection, Persian layout, history/baseline selection, ablations, exports and mobile width. It must inspect rendered content, not just screenshot generation.

See VALIDATION.md for the exact evidence available in this implementation turn. A green check does not prove universal semantic correctness or production readiness.
