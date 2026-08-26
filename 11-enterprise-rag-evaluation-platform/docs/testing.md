# Testing and failure injection

## Deterministic coverage

- duplicate document and case identifiers;
- missing golden relevance or facts;
- deterministic retrieval and invalid K;
- morphological normalization for refund/refunds/refunded (a defect found by the first test run);
- Precision@K, Recall@K, MRR, and nDCG ranking behavior;
- correct, incorrect, and missing citations;
- unsupported claims and missing expected facts;
- prompt-injection blocking and explicit test override;
- passing and failing quality gates;
- regression inside and outside tolerance;
- JSON parsing and inactive n8n exports;
- HTTP health and evaluation behavior.

## Failure injection

Use a wrong citation to lower faithfulness/citation accuracy, put a relevant document below an irrelevant one to lower MRR/nDCG, remove a relevant document to lower Recall@K, add an injection string to block a corpus, or reduce a current metric by more than tolerance to block promotion.

Green tests prove only these covered behaviors. Docker runtime, a real vector database, external models, high-volume concurrency, human rating reliability, and customer-corpus performance are not claimed by the fixture tests.
