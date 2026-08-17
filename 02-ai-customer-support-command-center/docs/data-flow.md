# Data flow

1. Authenticate the webhook and normalize a versioned channel event.
2. Hash `channel:sourceEventId`; a unique insert rejects replayed provider events.
3. Analyze the ticket against deterministic rules and versioned local articles.
4. Persist the redacted message, evidence, routing decision, and draft.
5. Auto-queue only high-confidence grounded, non-sensitive cases; medium cases await an identified reviewer; risky cases escalate.
6. The delivery worker claims due attempts with `FOR UPDATE SKIP LOCKED`.
7. Success closes delivery; transient errors use bounded exponential backoff; permanent or exhausted errors enter the DLQ.
