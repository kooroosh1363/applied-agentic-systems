# Verification and benchmark methodology

The system evaluates claims, not only whole-answer similarity. A factual claim passes when every cited identifier exists, at least one cited source contains its fact identifier, the actor may access that source, the evidence is current, and any structured value and unit match.

Conflicting sources do not silently select a winner. They require review. High-risk unsupported claims are blocked; standard-risk unsupported claims require review. Opinion claims are not treated as factual claims.

The synthetic golden set includes safe grounded output, safe abstention, missing and fabricated citations, scope violations, and numeric mismatches. Benchmark reporting uses a confusion matrix, precision, recall and false-positive rate. Before production, thresholds must be calibrated against representative human labels, including multilingual and adversarial slices.
