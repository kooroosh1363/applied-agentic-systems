# Threat Model

## Assets

- contact details and inquiry text;
- channel identifiers and consent state;
- provider credentials in optional real adapters;
- audit history and business routing rules.

## Primary threats and controls

| Threat | Control in reference project | Additional production requirement |
|---|---|---|
| forged webhook | documented shared-secret boundary | signed callbacks, rotation, replay window |
| replay/duplicate | deterministic key + unique database constraint | provider-specific signature timestamp |
| injection | typed normalization + parameterized SQL | WAF and payload size/rate policies |
| PII exposure | synthetic fixtures and no secrets | retention, encryption, access logging, deletion workflow |
| unauthorized follow-up | explicit consent rule | jurisdiction-specific legal review |
| mass messaging abuse | human handoff and provider isolation | quotas, opt-out registry, campaign approval |
| secret leakage | `.env` ignored + scanner | managed secret store and rotation |
| compromised dashboard | local password and no anonymous access | SSO, RBAC, TLS, private network |

## Non-goals

The local stack is not hardened for direct internet exposure. It is a reproducible engineering reference.

