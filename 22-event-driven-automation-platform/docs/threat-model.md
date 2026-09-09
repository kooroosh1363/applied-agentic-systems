# Threat model

## Assets

Tenant event data, signing keys, API-key hashes, subscriptions, delivery state, ordering state, DLQ records, quotas, and audit evidence.

## Defended abuse cases

- tenant or actor substitution through request fields;
- modified or stale signed events;
- duplicate producer delivery and quota double counting;
- out-of-order aggregate mutation;
- cross-tenant delivery completion;
- unlimited retry storms and automatic poison-message replay;
- terminal-state mutation and audit-chain tampering;
- malformed or oversized JSON.

## Residual risk

The reference does not include distributed locks, broker acknowledgements, transactional database execution, per-tenant key rotation, mTLS, WAF controls, schema compatibility automation, or disaster-recovery proof.
