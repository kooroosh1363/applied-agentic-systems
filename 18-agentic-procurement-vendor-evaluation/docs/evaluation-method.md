# Evaluation Method

Each criterion declares a direction, weight, optional minimum or maximum, and hard-constraint flag. Weights must sum to one. Numeric measurements are normalized within the compared set; boolean requirements map to zero or one hundred. Each contribution retains its raw value, normalized score, weight, weighted score, and evidence IDs.

Missing or low-confidence evidence makes a criterion incomplete. Hard failures, missing required documents, an uncleared fixture status, and budget overruns make a vendor ineligible instead of merely subtracting points. Eligible vendors are ranked by total weighted score with deterministic tie breaking.

The engine returns `recommendation_ready` only when at least two eligible vendors exist and the score gap is at least five points. One eligible vendor or a narrow gap requires review; no eligible vendor blocks the decision; high-impact procurement always requires human review.

TCO uses minor currency units and includes base price, implementation, and annual support over one to five years. The provided result remains synthetic and does not include taxes, exchange rates, contract indexation, financing, or organization-specific cost categories.
