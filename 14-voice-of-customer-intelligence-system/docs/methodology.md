# Analysis Methodology

The zero-cost classifier uses explicit English and Persian lexical dictionaries. Confidence reflects matched signals only; it is not a calibrated probability. Neutral means positive and negative lexicons tied or neither dominated. Unknown topics are routed to review.

An insight becomes `review_ready` only when all of these are true:

- every contributing record has consent;
- no contributing record was safety-blocked;
- the topic has at least the configured minimum group size;
- the topic appears across the configured minimum number of source channels;
- every claim contains source feedback IDs;
- exported quotes are redacted and capped.

This protects against invented summaries and over-generalizing from one loud comment. It does not solve sampling bias, sarcasm, dialect variation, or representativeness. Production evaluation needs a labeled multilingual test set, per-segment error analysis, calibration, drift monitoring, and reviewer disagreement measurement.

Trend comparison reports raw count deltas. It does not claim statistical significance or causality.
