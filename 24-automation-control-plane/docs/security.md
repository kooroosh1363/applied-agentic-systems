# Security boundaries

Clients control commands, workflow names and HTTP headers. Operators control credential configuration, actor identity and roles. Tenant is derived from credentials. The system rejects caller-supplied tenant fields. Self-approval compares stable actor identity within a tenant, even across separate credentials; an operator who intentionally assigns multiple identities to one person can defeat separation of duties. Identity governance is trusted configuration.

Hashing tokens avoids storing plaintext in the credential map. Tokens must be random and at least 32 characters; length alone is not entropy. Environment configuration still contains raw tokens. There is no expiry, live revocation or secret manager. Replace configuration and restart for the demo; production needs online rotation and durable state preservation.

Configuration only names the fixed local adapter and bounded concurrency. Arbitrary URLs, code, prompts and embedded secrets are not accepted. This is not a prompt-injection classifier. Health acknowledgements are trusted worker assertions, not cryptographic proof that infrastructure is running. Any authorized worker in a tenant may acknowledge its workflows; per-worker deployment assignments are not implemented.

Private fields prevent callers from mutating stored state through the public API. Reads return structured copies. Mutations clone state and commit only after validation, so contract errors leave state unchanged. Memory corruption, malicious trusted code and host administrators are outside this boundary. Generation checks provide single-process serialization, not multi-replica protection.

HTTP accepts at most 8192 body bytes and authenticates before parsing. TLS, connection limits, rate limiting and slow-client protection are required for nonlocal deployment. No global rate limiter or public admin bootstrap exists. Compose binds loopback, runs nonroot, uses read-only storage and drops capabilities. The Node image is major-tagged, not digest-pinned.

Pause prevents subsequent local resolve calls; it does not stop work already admitted or running, revoke copied configuration, or control disconnected workers. No claim of universal kill-switch enforcement is made.
