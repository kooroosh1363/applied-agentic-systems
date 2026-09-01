# Architecture

The intake gate validates incident identity, environment, timestamps, budgets, and untrusted text. Signal ingestion validates provenance, confidence, source type, and time window before deduplication and correlation. The severity classifier uses only verified, high-confidence signals. A versioned playbook produces bounded proposed actions; it never calls infrastructure tools.

High and critical actions require role-specific approvals. Even after all approvals, the system emits only an operator packet with `executionAuthorized=false` and `autoExecute=false`. Timeline events form a hash chain. Communication remains a draft. Closure requires a valid timeline, recovery evidence, a postmortem owner, corrective actions, and an authorized human review.
