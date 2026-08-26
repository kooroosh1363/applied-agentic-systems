# Architecture and data flow

## Components

1. **Golden dataset** — versioned questions, relevant document IDs, expected fact IDs, and tags.
2. **Corpus gate** — blocks known retrieval prompt-injection patterns before the run.
3. **Retriever adapter** — deterministic lexical implementation for the free local path; replaceable by a vector/search adapter.
4. **Metric engine** — calculates Precision@K, Recall@K, MRR, nDCG@K, Faithfulness, Citation Accuracy, and Answer Correctness.
5. **Quality gate** — compares aggregate scores with explicit thresholds.
6. **Regression gate** — compares the candidate with a checked-in versioned baseline and a bounded tolerance.
7. **Audit store** — PostgreSQL schema records dataset, run, case, metric, and finding identities.
8. **Orchestration** — n8n exports coordinate intake, execution, regression review, and reporting; exports are inactive until configured.

## Trust boundaries

Documents, retrieved chunks, generated claims, citations, and external model scores are untrusted inputs. Only a versioned dataset and policy-approved thresholds may influence a release decision. The local fixture is evidence about code behavior, not model quality in production.
