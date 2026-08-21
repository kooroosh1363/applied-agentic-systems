# Scoring model

The score is transparent and deterministic, not an unexplained AI judgment.

| Dimension | Maximum | Meaning |
|---|---:|---|
| Demand | 25 | repeated audience/support evidence |
| Brand fit | 25 | match with allowed themes; excluded themes block |
| Evidence quality | 20 | independent source types and verified sources |
| Freshness | 15 | recency of newest evidence |
| Business alignment | 15 | explicit content-strategy priority |
| Penalty | -45 | prompt injection, sensitive claim, or exclusion |

Thresholds are policy examples. A score is a prioritization aid, not proof that the topic will perform. Sensitive or injection-flagged topics require review even when the score is high. A production team should calibrate weights using a versioned historical dataset and compare ranking quality across releases.
