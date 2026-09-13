# Threat model and trust boundaries

Untrusted callers control JSON. Tenant, actor, role and technician qualifications come from trusted startup configuration. Commands reject extra fields, including tenant/actor claims. SQL uses placeholders for values; the UPDATE column list is fixed application code. Foreign keys and composite tenant/order keys support isolation. Tests demonstrate cross-tenant reads/mutations remain isolated through the public API.

Tokens must be random and at least 32 characters; minimum length is not an entropy guarantee. The service object keeps SHA-256 token hashes. Raw tokens remain in startup environment configuration and should not be printed or committed. There is no live expiry/revocation service; reload configuration and restart for rotation. Host administrators and code running in the service process are trusted; Python underscore fields are conventions, not a sandbox.

Issue inputs are controlled codes, not free-form model prompts. The mock classifier cannot dispatch, assign or close work. Review is human authorization, not evidence of a correct diagnosis. Completion codes assert a recording occurred; they do not cryptographically prove a physical repair. No safety-critical instructions or automated real-world work are performed.

Only assigned technicians may start/complete orders, and closure requires a different actor. The same human with separately configured identities can defeat this distinction; production identity governance is needed. Snapshot requires viewer but is tenant-wide rather than assignment-scoped; least-privilege field access and pagination are future work.

SQLite data and audit are not encrypted or tamper-evident. Filesystem ownership and trusted backups protect this local example. An administrator with database write access can alter history or bypass domain rules. There is no row-level database authorization for independent untrusted database clients. Independent-connection tests assume writes go through the command service.

HTTP caps body size at 8192 bytes, rejects transfer encoding and duplicate/missing lengths, and checks authentication before parsing. TLS, connection/rate limits and a production web server are needed outside localhost. Public health indicates liveness only. Docker runs nonroot with restricted privileges, but its image tag is not digest-pinned. This project is not a complete production security assessment.
