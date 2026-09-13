import { performance } from "node:perf_hooks";
import { randomUUID } from "node:crypto";
import {
  validateDataset,
  validateConfig,
  ensure,
  retrieve,
  rerank,
  extractAnswer,
  scan,
  conflicts,
  evaluateEvidence,
  aggregateResults,
  compareRegression,
  pairedBootstrap,
  POLICY,
  fingerprint,
  ENGINE_VERSION,
} from "./core.mjs";
import {
  embeddingRetrieve,
  generate,
  localModelConfig,
  judgeClaim,
} from "./adapters.mjs";

export async function runEvaluation(dataset, configInput = {}, options = {}) {
  validateDataset(dataset);
  const config = validateConfig(configInput),
    started = performance.now(),
    results = [];
  const model = options.modelConfig || localModelConfig();
  const live =
    config.retriever === "embedding" || config.generator === "ollama";
  for (const c of dataset.cases) {
    const start = performance.now();
    const docs = dataset.documents.filter(
      (d) => c.allowedScopes.includes(d.scope) && d.language === c.language,
    );
    // Gold labels are deliberately not passed to adapters or candidate generation.
    let ranking = scan(c.question).length
      ? []
      : config.retriever === "embedding"
        ? await embeddingRetrieve(c.question, docs, model, options.fetcher)
        : retrieve(c.question, docs, config);
    if (config.rerank) ranking = rerank(c.question, ranking, docs);
    if (config.fault === "drop-relevant") ranking = ranking.slice(1); // Controlled rank-one removal; does not consult gold labels.
    ranking = ranking.slice(0, config.k);
    const selected = ranking.map((r) =>
      docs.find((d) => d.documentId === r.documentId),
    );
    const blocked =
      scan(c.question).length || selected.some((d) => scan(d.text).length);
    let answer =
      blocked || conflicts(selected).length
        ? { abstained: true, claims: [] }
        : config.generator === "ollama"
          ? await generate(c.question, selected, model, options.fetcher)
          : extractAnswer(selected);
    if (config.fault === "wrong-number")
      answer = {
        ...answer,
        claims: answer.claims.map((claim) => ({
          ...claim,
          text: claim.text.replace(/[0-9۰-۹]+/u, "999"),
        })),
      };
    if (config.fault === "wrong-citation")
      answer = {
        ...answer,
        claims: answer.claims.map((claim) => ({
          ...claim,
          citations: ["nonexistent-source"],
        })),
      };
    const result = evaluateEvidence(c, dataset, ranking, answer, config);
    result.latencyMs = Number((performance.now() - start).toFixed(3));
    results.push(result);
  }
  const report = {
    runId: randomUUID(),
    createdAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    datasetId: dataset.datasetId,
    datasetVersion: dataset.version,
    datasetHash: fingerprint(dataset),
    policyHash: fingerprint(POLICY),
    policy: POLICY,
    config,
    models: live
      ? {
          embedding:
            config.retriever === "embedding" ? model.embeddingModel : null,
          generator:
            config.generator === "ollama" ? model.generationModel : null,
        }
      : null,
    evidence: {
      dataset: "synthetic",
      reviewStatus: dataset.reviewStatus,
      execution: live ? "local-model" : "deterministic-local",
      semanticEntailment: "not_measured",
      externalDelivery: false,
    },
    summary: aggregateResults(results),
    results,
    totalLatencyMs: Number((performance.now() - started).toFixed(3)),
    notices: [
      "Exact quote support measures attribution, not semantic truth.",
      "Fixture outcomes are authored and not independent human labels.",
      "Latency measures this local execution, not a production benchmark.",
      "Retrieval is evaluated on answerable/review cases; no-gold cases have null retrieval metrics.",
    ],
  };
  return report;
}
export function compareRuns(candidate, baseline) {
  const regression = compareRegression(candidate, baseline);
  const interval = pairedBootstrap(candidate, baseline);
  return {
    ...candidate,
    baselineRunId: baseline.runId,
    baselineConfig: baseline.config,
    regression,
    interval,
    changedCases: candidate.results
      .map((r) => {
        const b = baseline.results.find((x) => x.caseId === r.caseId);
        return {
          caseId: r.caseId,
          before: b.outcome,
          after: r.outcome,
          beforeCorrect: b.outcomeCorrect,
          afterCorrect: r.outcomeCorrect,
          factCoverageDelta:
            r.answer.factCoverage === null || b.answer.factCoverage === null
              ? null
              : r.answer.factCoverage - b.answer.factCoverage,
        };
      })
      .filter(
        (r) =>
          r.before !== r.after ||
          r.beforeCorrect !== r.afterCorrect ||
          r.factCoverageDelta,
      ),
    releaseDecision:
      candidate.summary.passed && regression.passed
        ? "eligible_for_human_review"
        : "blocked",
    humanApprovalRequired: true,
  };
}
export async function runComparison(dataset, config = {}, options = {}) {
  const baseline =
    options.baseline ||
    (await runEvaluation(
      dataset,
      {
        retriever: "bm25",
        k: 2,
        rerank: false,
        generator: "extractive",
        fault: "none",
      },
      options,
    ));
  const candidate = await runEvaluation(dataset, config, options);
  return { baseline, candidate: compareRuns(candidate, baseline) };
}
export async function runAblation(dataset, options = {}) {
  const variants = [
    { retriever: "lexical", k: 1 },
    { retriever: "bm25", k: 1 },
    { retriever: "bm25", k: 2 },
    { retriever: "bm25", k: 2, rerank: true },
  ];
  const reports = [];
  for (const v of variants)
    reports.push(await runEvaluation(dataset, v, options));
  return reports.map((r) => compareRuns(r, reports[2]));
}
export async function advisoryJudge(report, model = localModelConfig()) {
  const rows = [];
  for (const r of report.results)
    for (const [i, c] of r.answer.claims.entries()) {
      const sources = r.rankedDocuments
        .filter((d) => c.citations.includes(d.documentId))
        .map((d) => d.text);
      rows.push({
        caseId: `${r.caseId}:${i}`,
        claim: c.text,
        predicted: await judgeClaim(c.text, sources, model),
        labelSource: "model-only-not-human",
      });
    }
  return {
    runId: report.runId,
    model: model.judgeModel,
    advisory: true,
    releaseDecisionUnchanged: true,
    rows,
  };
}
