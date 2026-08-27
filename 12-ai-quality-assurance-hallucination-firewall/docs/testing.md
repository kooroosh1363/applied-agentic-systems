# Testing and failure injection

Run project tests with `npm test` or the full repository contract with `npm run check` at repository root.

Deterministic tests cover valid grounding, high-risk policy, injection and PII, missing/fabricated citations, source authorization, stale and conflicting evidence, unsupported claims, numeric and unit mismatches, safe abstention, retry/DLQ behavior, audit tampering, benchmark metrics, HTTP contracts and n8n exports.

Recommended failure drills:

- expire a cited source and confirm review routing;
- change a fact value without changing the candidate and confirm blocking;
- remove actor access and confirm retries are skipped;
- mutate a stored audit event and confirm chain verification fails;
- inject adversarial instructions into retrieved evidence;
- exhaust bounded repair attempts and confirm DLQ capture.

Docker Compose is validated in GitHub Actions. Local execution requires Docker and is not inferred merely from valid YAML.
