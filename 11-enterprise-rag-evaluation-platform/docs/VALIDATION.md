# Project 11 v2 validation evidence

## Executed locally

- 46 deterministic, API, storage and adapter-contract tests passed under Node 24.19.0. Root-style `node --test` discovery also passes without picking up optional browser/PostgreSQL scripts.
- Full synthetic evaluation: 33 cases, 17 source documents, English/Persian. Clean BM25/K=2 candidate meets the illustrative policy and is eligible for human review.
- Wrong-number injection: quote support and reference fact coverage fall to 65.38%, expected-outcome accuracy to 45.45%; shared quality/regression gates block it. The CLI exits 1 as intended.
- K=1 ablations: Recall@K 92.86%, outcome accuracy 93.94%; K=2 restores coverage on this development set. Phrase reranking produces no measured improvement on this set; no benefit is invented.
- Real Chromium browser: clean and blocked runs, 999-day evidence drill-down, Persian cases, four ablations, stored baseline selection, HTML download. Checked 1920, 1366, 768 and 390 px widths: no page horizontal overflow and no JavaScript page errors.
- File-store reopen/checksum validation and duplicate UUID rejection passed.
- n8n code-node policy and graph-reference tests passed. Native n8n import/execution was not performed.

See `benchmarks/local-results.json` for reproducible, measured summaries. Rebuild with `node scripts/benchmark.mjs`.

## Integration gates

The PR includes a PostgreSQL 16 service integration job plus Docker image build/health smoke test. Local PostgreSQL execution could not be completed in the managed runtime (running the database under an unprivileged user was unavailable); remote CI outcomes must be checked independently.

Optional Ollama embedding/generation/judge adapters were tested against explicit network stubs only. No installed real model or independent human calibration dataset was available in this environment. No live-model quality claim is made. Windows launcher was inspected, while execution/browser testing took place on Linux; running it on the user's Acer is the remaining device-specific check.

## Validity boundaries

The development dataset is synthetic and authored, not an independently reviewed holdout. Thresholds were chosen with this set visible. Exact quote attribution is not semantic entailment, truth, completeness or general answer correctness. Expected outcomes, source facts and conflicts rely on authored metadata. A general adversarial safety claim or production-readiness claim is not supported.
