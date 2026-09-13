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

GitHub Actions verified implementation commit `f7e27b14f59ee5c642c7cb75291896ab91eeaa67`:

- [Project 11 integration run 34762166259](https://github.com/kooroosh1363/applied-agentic-systems/actions/runs/34762166259): **passed**. Actual PostgreSQL 16 migration, report round-trip, dataset-version coexistence and duplicate UUID rejection; Node 22 tests/evaluation; Docker image build and HTTP health smoke test.
- [Repository Quality run 34762166244](https://github.com/kooroosh1363/applied-agentic-systems/actions/runs/34762166244): **passed**.

The first integration attempt failed before application execution because of service health-command quoting; the command was corrected and the full job passed. Local PostgreSQL execution was unavailable in the managed runtime; the real-database evidence above comes from GitHub Actions, not a mock.

Optional Ollama embedding/generation/judge adapters were tested against explicit network stubs only. No installed real model or independent human calibration dataset was available in this environment. No live-model quality claim is made. Windows launcher was inspected, while execution/browser testing took place on Linux; running it on the user's Acer is the remaining device-specific check.

## Validity boundaries

The development dataset is synthetic and authored, not an independently reviewed holdout. Thresholds were chosen with this set visible. Exact quote attribution is not semantic entailment, truth, completeness or general answer correctness. Expected outcomes, source facts and conflicts rely on authored metadata. A general adversarial safety claim or production-readiness claim is not supported.
