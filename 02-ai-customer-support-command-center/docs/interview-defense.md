# Interview defense notes

## 60-second explanation

This project converts fragmented support messages into an auditable lifecycle. Provider event identity prevents duplicate side effects. A deterministic local engine removes PII, classifies the request, retrieves evidence, and makes a bounded routing decision. Only high-confidence grounded and non-sensitive replies can be queued automatically; ambiguous or risky cases require people. Delivery uses state, bounded retry, backoff, and DLQ, with PostgreSQL audit records and observable counters.

## Hard questions

**Why not let an LLM answer everything?** Because fluency is not evidence. Automation is limited by confidence, grounding, sensitivity, and business risk.

**Is it production-grade?** It is production-oriented and demonstrates controls, but real signatures, RBAC, HA, provider tests, load tests, retention, and operational SLO evidence remain explicitly open.

**Why PostgreSQL uniqueness and not only n8n execution IDs?** Provider retries can create multiple workflow executions. Business idempotency must survive orchestration retries and restarts.

**What is the main trade-off?** Conservative routing increases human workload but reduces unsafe replies. Thresholds should be calibrated using labelled outcomes, not guessed.

**How would you upgrade the AI layer?** Add an evaluated local or hosted model behind the same contract, version corpus and prompts, measure retrieval recall/faithfulness, and keep approval/risk controls independent of the model.
