# Project 11 v2 acceptance plan

Scope: a local evaluation workbench, reproducible synthetic benchmark, and optional local-model adapters. No claim of universal semantic verification or customer production readiness.

1. Trusted server-owned datasets and policy. Reject unknown fields, non-finite metrics, duplicate identities, unauthorized retrieval and test overrides at the HTTP boundary.
2. One runner for CLI/API/UI: case outcomes, retrieval metrics, extractive evidence support, reference fact coverage, slice gates and compatible baseline regression.
3. Exact evidence quotes are checked against retrieved corpus text. This establishes attribution, not real-world truth or semantic entailment. Non-extractive text remains unverified unless separately reviewed. Never use model-supplied fact IDs as proof.
4. Versioned bilingual synthetic cases cover answerable, unanswerable, conflicting evidence and injection. Review status stays authored/unreviewed; machine-created labels are not human ground truth.
5. Lexical, BM25 and optional Ollama embeddings, optional local generation and advisory model judge; label live adapter evidence separately. Judge calibration requires independently human-reviewed labels and reports confusion/coverage rather than declaring a judge objective.
6. Baseline/candidate comparison, ablations, paired bootstrap intervals, evidence drill-down, persistent run history and JSON/CSV/HTML exports.
7. Local UI binds loopback, checks Origin/Host, limits request size and concurrency. Docker persistence and optional PostgreSQL have explicit integration gates.
8. Reproduce every reported v1 defect; test deterministic and HTTP paths, inspect real browser UI, and record limitations. Work on branch; do not merge.
