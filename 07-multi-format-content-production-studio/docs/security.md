# Security and threat model

| Threat | Control | Residual risk |
|---|---|---|
| forged brief/review webhook | separate shared secrets and authenticated actor | rotate secrets and use a real identity provider in production |
| prompt injection in research | evidence is untrusted; source and output scans | heuristic detection is not a proof of safety |
| unsupported claim | claim-to-evidence references and factual reviewer | reviewer can still make mistakes |
| PII leakage | pre-export scan and blocked QA state | regex is incomplete for all locales |
| unauthorized approval | allow-listed roles and one decision per role/version | production needs RBAC/JWT verification |
| SSRF through evidence URL | HTTP/HTTPS scheme restriction | production should add hostname allow-list and egress policy |
| replay/duplicate delivery | idempotency keys, uniqueness and immutable manifest | downstream provider must also accept idempotency keys |
| secret exposure | `.env`, placeholders and repository secret scan | operator configuration remains sensitive |

Use least-privilege PostgreSQL and n8n credentials, TLS, encrypted backups, restricted egress, audit retention, dependency scanning and secret rotation before external deployment.
