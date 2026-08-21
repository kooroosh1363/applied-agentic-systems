# Data flow

1. Authenticate a bounded content-signal request.
2. Normalize source identity, timestamp, URL, audience, evidence label, and text.
3. Generate a source-scoped SHA-256 key and persist the signal once.
4. Load a bounded 30-day evidence window; never execute source text as instructions.
5. Create deterministic candidates, canonicalize titles, merge near duplicates, and retain evidence IDs.
6. Calculate demand, brand fit, evidence quality, freshness, business alignment, and penalties.
7. Reject excluded themes; route sensitive or suspicious material to identified human review.
8. Promote only approved topics into the content backlog.
9. Accept authenticated, idempotent performance facts and reject impossible funnels.
10. Calculate KPIs only from `source_verified` performance, keeping simulations separate.
