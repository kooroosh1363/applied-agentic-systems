# Security and cultural risk

| Threat | Control | Residual risk |
|---|---|---|
| forged intake/review | separate secrets and identified actor | production needs OIDC/JWT and RBAC |
| prompt injection in source | source remains untrusted; input/output scan | heuristics are incomplete |
| PII leakage | pre-export detection | locale-aware DLP is still needed |
| glossary manipulation | versioned repository policy and package lock | signed policy artifacts are stronger |
| unapproved translation | approved-memory filter and fail-closed marker | memory approval can still be wrong |
| cultural harm | locale patterns and cultural reviewer | professional local review remains required |
| bidi spoofing | explicit direction metadata and review | Unicode confusable scanning is future work |
| replay/duplicate publication | stable IDs, uniqueness, immutable export | provider idempotency must also exist |
| secret exposure | environment placeholders and repository scan | use a secret manager and rotation in production |

The project does not treat a language model or translation memory as an authority on legal, medical, financial, political or culturally sensitive copy.
