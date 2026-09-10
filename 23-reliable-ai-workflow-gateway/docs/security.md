# Threat model

Untrusted clients control JSON, keys, text and headers. Trusted operators control credentials, workflows, configuration and adapter code. Credential hashes map to tenant identity; plaintext tokens are not retained by the gateway. HTTP authorization occurs before body parsing. This does not replace TLS: place any nonlocal deployment behind authenticated TLS ingress with connection and request-rate limits.

Clients cannot choose tenant, destination URL or executable code. Prompts are data passed to a fixed local classifier. The implementation makes no claim of detecting every prompt injection or PII. A future model adapter needs its own tool restrictions, evidence checks and privacy controls.

Bounded input, active operations and retained records constrain application work. Duplicate response waiters, slow connections and ingress traffic still require infrastructure controls. One tenant can exhaust the shared record capacity; production needs tenant quotas and durable retention policy. Credentials must be random, generated outside version control and rotated by replacing configuration and restarting; no dynamic revocation endpoint is provided.

Audit records contain tenant, execution ID, sequence, terminal status and sanitized code. They omit prompt text, tokens and raw exceptions. They are mutable in-process records, not tamper-evident durable audit storage. The adapter receives prompt text in memory; no blanket PII redaction is promised. A future external adapter must not retain the mock evidence markers unchanged.

Compose binds the host port to loopback, runs as a nonroot user, mounts source read-only, drops capabilities and limits memory and process count. The image tag is a major-version tag, not a supply-chain digest pin.
