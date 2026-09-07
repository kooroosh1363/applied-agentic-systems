# Threat model

## Assets

Tenant data, memberships, API-key hashes, workflow runs, quota, DLQ records and audit evidence.

## Trust boundaries

The public HTTP request is untrusted. Tenant and actor identity are derived from the bearer credential, never accepted from the request body. Provisioning requires a separate bootstrap credential. Run completion requires both a tenant-scoped key and a worker credential.

## Defended abuse cases

- self-promotion and cross-tenant identifier substitution;
- predictable, expired, revoked or under-scoped API keys;
- duplicate effects through idempotency replay;
- terminal-state mutation and unauthorised worker completion;
- oversized or malformed JSON;
- audit-event mutation through per-tenant HMAC chains.

## Residual production work

Move secrets to an external secret manager, use a durable queue, enforce PostgreSQL transactions/RLS with a non-owner runtime role, add distributed rate limiting, rotate HMAC keys, and run backup/restore and load tests. The repository claims these patterns, not customer production operation.
