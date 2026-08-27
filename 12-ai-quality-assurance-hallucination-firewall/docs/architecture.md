# Architecture and data flow

The firewall sits after answer generation and before any user-facing delivery. It does not trust model prose or citation labels. The request, actor scopes, evidence pack and structured claims are validated independently.

1. Intake validates identifiers, actor context and evidence contracts.
2. The safety gate scans the prompt and retrieved evidence for injection, secrets and selected PII patterns.
3. Each factual claim is mapped to cited sources and a fact identifier.
4. Authorization, expiry, conflict, numeric and unit checks create findings.
5. Policy combines domain risk and finding severity into allow, review or block.
6. Blocked responses produce a deterministic safe replacement. Only repairable failures may retry.
7. Every terminal outcome is appended to a tamper-evident audit chain.

The n8n exports show orchestration boundaries; `src/core.mjs` is the executable source of truth for the deterministic reference implementation.
