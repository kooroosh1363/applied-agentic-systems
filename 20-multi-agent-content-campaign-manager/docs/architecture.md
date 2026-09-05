# Architecture

The manager accepts a versioned campaign brief, approved source evidence, channels, KPIs, budget, schedule, locale, owner, and brand policy. A ten-step directed acyclic work graph coordinates seven bounded agents: strategy, audience, creative, channel, compliance, measurement, and coordinator. Agent and tool allowlists, dependency validation, cycle detection, step budgets, and tool-call budgets limit delegation.

Creative and compliance work remains independently verifiable. Claims must cite approved evidence with sufficient confidence. Channel assets retain claim IDs, policy version, character limits, and fingerprints. Budget allocation uses integer money, reserves ten percent, and never authorizes spend.

After every asset receives its required marketing, brand, and risk-dependent compliance reviews, the coordinator creates a packet for handoff review. It can produce a publishing handoff for Project 09 and an experiment-design handoff for Project 10. Neither handoff publishes, schedules, spends, configures assignment, or grants causal attribution.

Audit events form a hash chain. Retry is bounded and exhausted work enters a DLQ with no automatic replay. PostgreSQL repeats critical non-publishing, non-spending, and non-attribution invariants.
