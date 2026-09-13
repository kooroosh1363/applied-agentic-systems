# Project 11 — Evidence / RAG Evaluation Workbench

A local, bilingual RAG evaluation workbench with a real browser interface, evidence drill-down, baseline comparisons, ablations and persistent reports. No paid API or account is needed for the default path.

**Scope:** an engineering reference on 33 synthetic, authored cases. Exact quote support establishes source attribution, not semantic truth. It is not a general hallucination detector, an independently validated benchmark, or a customer production service.

![Workbench showing a blocked candidate](docs/images/workbench.png)

## Start on Windows

Install Node.js **22 or newer**, download this repository, open this project folder and double-click **`Start-Demo.cmd`**. It starts the local server and opens `http://localhost:8110` in your browser. Keep the terminal open; Ctrl+C stops the server. No npm install is required for the default file-storage/extractive mode.

On any platform:

```bash
node src/server.mjs
# Open http://localhost:8110
```

For an Acer laptop, the default mode needs no GPU. Optional local language models have their own RAM/runtime requirements; no device-specific performance claim is made.

## What works

- **Retrieval:** lexical overlap, BM25, optional Ollama embeddings; configurable K and deterministic phrase reranking (not a neural cross-encoder).
- **Evidence:** exact complete-sentence attribution, citation precision, corpus-owned reference fact coverage; caller-supplied fact IDs never prove an answer.
- **Evaluation:** 33 English/Persian synthetic cases with answerable, numeric, unanswerable, conflicting, adversarial, multi-document and access-scope scenarios.
- **Gates:** one runner for UI/API/CLI, per-slice outcome gates, expected vs. unexpected safety blocks, compatible-baseline regression, paired bootstrap outcome deltas.
- **Experiments:** four retrieval ablations and clearly marked wrong-number, wrong-citation and rank-removal fault injection.
- **Reports:** case evidence, local run history, user-selected baseline and JSON/CSV/HTML downloads. CSV formula prefixes and HTML are escaped.
- **Storage:** atomic local files by default; actual optional PostgreSQL adapter with a PostgreSQL 16 integration test. Checksums detect accidental changes, not a malicious operator who can rewrite both content and checksum.
- **Local models:** optional embedding, extractive-prompt generation and advisory judge adapters. Judge calibration requires operator-declared independent human labels and never overrides release decisions.

## Validation

```bash
npm test
npm run evaluate
npm run ablation
node src/cli.mjs --fault
```

The last command deliberately produces a blocked candidate and exits with code 1. `artifacts/latest.json` contains the detailed comparison. Measured results and remaining validation boundaries are in [Validation](docs/VALIDATION.md).

The source-controlled baseline descriptor `baselines/v1.json` is retired. v2 persists a real baseline execution with dataset/policy/engine hashes. A passed candidate is **eligible for human review**, never automatically promoted.

## Optional local models

Install and run Ollama separately and download the models you choose. Copy `.env.example` to `.env`, set installed model names, then run:

```bash
node --env-file=.env src/server.mjs
```

- `OLLAMA_EMBED_MODEL`: real vectors via `/api/embed`.
- `OLLAMA_MODEL`: generated structured claims via `/api/chat`; unverified paraphrases do not receive quote support.
- `OLLAMA_JUDGE_MODEL`: advisory entailment labels via `/api/chat`.

The UI enables these options only when model names are configured. Configuration does not prove availability or quality. The default lexical coverage threshold does not apply to cosine rankings; no-answer behavior with embeddings needs calibration. Live model failures are surfaced, never silently replaced with mock outputs. Downloading local models requires internet once, but no paid provider.

## Storage and Docker

Default:

```bash
docker compose up --build
```

Only `127.0.0.1:8110` is published. Reports use a named volume. This default image has no model server and uses local file storage.

PostgreSQL option for the Node host process:

```bash
npm ci
# Copy .env.example to .env and change the local DB password first.
docker compose --profile postgres up -d postgres
# Set DATABASE_URL in .env to postgresql://rag_eval:PASSWORD@127.0.0.1:5433/rag_eval
node --env-file=.env scripts/postgres-check.mjs
node --env-file=.env src/server.mjs
```

The `pg` dependency is optional and pinned. PostgreSQL configuration fails closed if the package, server or schema is missing; there is no silent switch to file storage. For an existing database, apply `database/001_init.sql` explicitly: initialization mounts run only for a new volume. v2 tables are additive and do not destroy v1 data.

## More detail

- [Architecture](docs/architecture.md)
- [Evaluation methodology and limits](docs/evaluation-methodology.md)
- [Security, persistence and operations](docs/security-and-operations.md)
- [Acceptance and regression tests](docs/testing.md)
- [Local demo instructions](docs/DEMO.md)
- [Implementation plan](docs/IMPLEMENTATION-PLAN.md)

n8n exports call the shared workbench API and stay inactive. They require separately configured n8n, `EVALUATOR_URL` and a strong `P11_API_TOKEN` shared with the Node process. Run n8n on the same host or configure its networking explicitly; `localhost` inside an unrelated container does not reach the host. The built-in UI does not require n8n.
