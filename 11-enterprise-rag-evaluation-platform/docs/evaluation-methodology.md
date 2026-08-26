# Evaluation methodology

## Retrieval

- **Precision@K:** relevant retrieved documents divided by all retrieved documents.
- **Recall@K:** relevant retrieved documents divided by all golden relevant documents.
- **MRR:** reciprocal rank of the first relevant document.
- **nDCG@K:** rewards relevant documents appearing earlier in the ranking.

## Answer quality

- **Faithfulness:** fraction of answer claims supported by at least one cited retrieved document containing the claim's fact ID.
- **Citation Accuracy:** fraction of citations that actually support the cited claim.
- **Answer Correctness:** fraction of expected golden facts covered by supported claims.

Fact IDs make the fixture deterministic. A real evaluation program should have domain reviewers label claims and periodically measure agreement between human ratings and any automated judge. Never present an LLM judge as objective ground truth.

## Release policy

A release passes only when aggregate thresholds pass and no baseline metric regresses beyond tolerance. Important slices such as language, product, risk class, and query type should also receive independent gates in a real deployment.
