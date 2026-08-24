# Security, governance and operations

Never place social access tokens in workflow JSON, tests, screenshots or Git. `.env.example` contains placeholders only. In production, use scoped OAuth tokens, encryption at rest, secret rotation, least-privilege RBAC and separate publishing identities by tenant/brand.

Human approval is a governance control, not a legal guarantee. Legal, brand and platform policies remain jurisdiction- and channel-specific. The reference detects a small explicit list of unsafe patterns and must not be represented as complete moderation.

Monitor: draft-to-published latency, policy failure rate by code, approval latency, retry count, DLQ count, scheduling conflicts and provider-verified delivery rate. Cost per execution is not calculated here because the local path uses no paid provider; production costs depend on chosen social adapters and observability stack.

For incident response: pause the affected channel, revoke its OAuth token, quarantine its queued items, retain the immutable event evidence, decide whether a corrective post is necessary, then replay only reviewed records from DLQ.
