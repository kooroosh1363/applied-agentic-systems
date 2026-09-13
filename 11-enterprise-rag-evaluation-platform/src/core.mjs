import { createHash } from "node:crypto";

export const ENGINE_VERSION = "2.0.0";
export const normalize = (value) =>
  String(value)
    .normalize("NFKC")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase();
export const canonical = (value) =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(",")}]`
    : value && typeof value === "object"
      ? `{${Object.keys(value)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
          .join(",")}}`
      : JSON.stringify(value);
export const fingerprint = (value) =>
  createHash("sha256").update(canonical(value)).digest("hex");
export const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
export const round = (x) => (x === null ? null : Number(x.toFixed(6)));
export function ensure(ok, message) {
  if (!ok) throw new Error(message);
}
export function object(value, name) {
  ensure(
    value && typeof value === "object" && !Array.isArray(value),
    `${name}: object required`,
  );
}
export function keys(value, allowed, name) {
  object(value, name);
  ensure(
    Object.keys(value).every((k) => allowed.includes(k)),
    `${name}: unknown field`,
  );
}
export function string(value, name, max = 20000) {
  ensure(
    typeof value === "string" && value.trim().length > 0 && value.length <= max,
    `${name}: nonempty bounded string required`,
  );
  return value;
}
export function array(value, name, max = 2000) {
  ensure(
    Array.isArray(value) && value.length <= max,
    `${name}: bounded array required`,
  );
  return value;
}
export function unique(xs, name) {
  ensure(new Set(xs).size === xs.length, `${name}: duplicate identity`);
}
export function unit(x, name) {
  ensure(
    typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1,
    `${name}: finite number in [0,1] required`,
  );
}
export function integer(x, min, max, name) {
  ensure(
    Number.isInteger(x) && x >= min && x <= max,
    `${name}: integer ${min}..${max} required`,
  );
}
const STOP = new Set(
  "the and for are how what where when with this that have does into from must can within of a to is in it do i my be on an should می که از به در و را است چه برای".split(
    " ",
  ),
);
export function tokens(s) {
  return (
    normalize(s)
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((x) => x.length > 1 && !STOP.has(x))
      .map((x) => (x.endsWith("s") && x.length > 4 ? x.slice(0, -1) : x)) ?? []
  );
}
export function scan(text) {
  const patterns = [
    /ignore\s+(?:(?:all|the|any|previous)\s+)*instructions/iu,
    /reveal\s+(?:the\s+)?(?:system prompt|password|secret)/iu,
    /<script\b/iu,
    /دستور(?:های|ات)?\s+قبلی\s+را\s+نادیده/iu,
  ];
  return patterns.some((p) => p.test(text)) ? ["known_injection_pattern"] : [];
}
export function validateDataset(d) {
  keys(
    d,
    [
      "datasetId",
      "version",
      "provenance",
      "reviewStatus",
      "documents",
      "cases",
    ],
    "dataset",
  );
  string(d.datasetId, "datasetId", 100);
  string(d.version, "version", 100);
  ensure(
    d.provenance === "synthetic",
    "This workbench accepts only synthetic datasets",
  );
  ensure(
    ["authored-unreviewed", "human-reviewed"].includes(d.reviewStatus),
    "reviewStatus invalid",
  );
  array(d.documents, "documents", 500);
  ensure(d.documents.length > 0, "documents required");
  unique(
    d.documents.map((x) => x.documentId),
    "documents",
  );
  for (const doc of d.documents) {
    keys(
      doc,
      [
        "documentId",
        "title",
        "text",
        "language",
        "scope",
        "sourceUri",
        "version",
        "facts",
      ],
      "document",
    );
    for (const k of [
      "documentId",
      "title",
      "text",
      "language",
      "scope",
      "sourceUri",
      "version",
    ])
      string(doc[k], k);
    array(doc.facts, "facts", 100);
    unique(
      doc.facts.map((x) => x.factId),
      "facts",
    );
    for (const fact of doc.facts) {
      keys(fact, ["factId", "text", "topic", "value"], "fact");
      for (const k of ["factId", "text", "topic", "value"]) string(fact[k], k);
      ensure(
        normalize(doc.text).includes(normalize(fact.text)),
        "fact not present in corpus",
      );
    }
  }
  array(d.cases, "cases", 200);
  ensure(d.cases.length > 0, "cases required");
  unique(
    d.cases.map((x) => x.caseId),
    "cases",
  );
  const docs = new Map(d.documents.map((x) => [x.documentId, x]));
  for (const c of d.cases) {
    keys(
      c,
      [
        "caseId",
        "question",
        "language",
        "tags",
        "allowedScopes",
        "relevantDocumentIds",
        "expectedFactIds",
        "expectedOutcome",
      ],
      "case",
    );
    for (const k of ["caseId", "question", "language"]) string(c[k], k);
    ensure(
      ["answer", "abstain", "review", "block"].includes(c.expectedOutcome),
      "expected outcome invalid",
    );
    for (const k of [
      "tags",
      "allowedScopes",
      "relevantDocumentIds",
      "expectedFactIds",
    ]) {
      array(c[k], k, 100);
      c[k].forEach((x) => string(x, k));
      unique(c[k], k);
    }
    ensure(c.allowedScopes.length > 0, "scope required");
    ensure(
      c.relevantDocumentIds.every(
        (id) => docs.has(id) && c.allowedScopes.includes(docs.get(id).scope),
      ),
      "unknown or unauthorized golden document",
    );
    const facts = new Set(
      c.relevantDocumentIds.flatMap((id) =>
        docs.get(id).facts.map((f) => f.factId),
      ),
    );
    ensure(
      c.expectedFactIds.every((id) => facts.has(id)),
      "unknown golden fact",
    );
    if (c.expectedOutcome === "answer")
      ensure(
        c.relevantDocumentIds.length && c.expectedFactIds.length,
        "answerable case requires gold labels",
      );
  }
  return d;
}
export function validateConfig(c = {}) {
  keys(
    c,
    ["retriever", "k", "rerank", "generator", "fault", "minQueryCoverage"],
    "config",
  );
  const v = {
    retriever: "bm25",
    k: 2,
    rerank: false,
    generator: "extractive",
    fault: "none",
    minQueryCoverage: 0.3,
    ...c,
  };
  ensure(
    ["lexical", "bm25", "embedding"].includes(v.retriever),
    "retriever invalid",
  );
  integer(v.k, 1, 10, "k");
  unit(v.minQueryCoverage, "minQueryCoverage");
  ensure(typeof v.rerank === "boolean", "rerank boolean required");
  ensure(["extractive", "ollama"].includes(v.generator), "generator invalid");
  ensure(
    ["none", "wrong-number", "wrong-citation", "drop-relevant"].includes(
      v.fault,
    ),
    "fault invalid",
  );
  return v;
}
export function retrieve(question, documents, config) {
  const q = [...new Set(tokens(question))],
    bags = documents.map((d) => tokens(d.title + " " + d.text));
  const avg = mean(bags.map((x) => x.length)) || 1;
  const scored = documents
    .map((d, i) => {
      const bag = bags[i];
      let score = 0;
      for (const t of q) {
        const tf = bag.filter((x) => x === t).length;
        if (config.retriever === "lexical")
          score += tf ? 1 / Math.max(q.length, 1) : 0;
        else {
          const df = bags.filter((b) => b.includes(t)).length;
          const idf = Math.log(1 + (bags.length - df + 0.5) / (df + 0.5));
          score +=
            (idf * tf * 2.2) / (tf + 1.2 * (0.25 + (0.75 * bag.length) / avg));
        }
      }
      const coverage =
        q.filter((t) => bag.includes(t)).length / Math.max(q.length, 1);
      return { documentId: d.documentId, score, coverage };
    })
    .filter((x) => x.score > 0 && x.coverage >= config.minQueryCoverage)
    .sort(
      (a, b) => b.score - a.score || a.documentId.localeCompare(b.documentId),
    );
  return scored;
}
export function rerank(question, ranking, docs) {
  // Deterministic phrase bonus, NOT a neural cross-encoder. Operates on top ten only.
  const q = tokens(question);
  const byId = new Map(docs.map((d) => [d.documentId, d]));
  return ranking
    .slice(0, 10)
    .map((r) => {
      const text = normalize(byId.get(r.documentId).text);
      const pairs = q
        .slice(0, -1)
        .filter((t, i) => text.includes(`${t} ${q[i + 1]}`)).length;
      return { ...r, score: r.score + 0.2 * pairs };
    })
    .sort(
      (a, b) => b.score - a.score || a.documentId.localeCompare(b.documentId),
    );
}
export function scoreRetrieval(retrieved, relevant, k = retrieved.length) {
  integer(k, 1, 10, "k");
  array(retrieved, "ranking", k);
  unique(
    retrieved.map((r) => r.documentId),
    "ranking",
  );
  unique(relevant, "gold ranking");
  for (const r of retrieved) string(r.documentId, "rank document");
  if (!relevant.length)
    return { precisionAtK: null, recallAtK: null, mrr: null, ndcgAtK: null };
  const rel = new Set(relevant),
    hits = retrieved.map((r) => rel.has(r.documentId));
  const n = hits.filter(Boolean).length,
    first = hits.indexOf(true);
  const dcg = hits.reduce(
    (s, hit, i) => s + (hit ? 1 / Math.log2(i + 2) : 0),
    0,
  );
  const ideal = Array.from(
    { length: Math.min(k, rel.size) },
    (_, i) => 1 / Math.log2(i + 2),
  ).reduce((a, b) => a + b, 0);
  return {
    precisionAtK: n / k,
    recallAtK: n / rel.size,
    mrr: first < 0 ? 0 : 1 / (first + 1),
    ndcgAtK: ideal ? dcg / ideal : 0,
  };
}
export function validateAnswer(answer) {
  keys(answer, ["abstained", "claims"], "answer");
  ensure(typeof answer.abstained === "boolean", "abstained boolean required");
  array(answer.claims, "claims", 50);
  ensure(
    answer.abstained ? answer.claims.length === 0 : answer.claims.length > 0,
    "inconsistent abstention",
  );
  for (const c of answer.claims) {
    keys(c, ["text", "citations"], "claim");
    string(c.text, "claim text", 4000);
    array(c.citations, "citations", 10);
    c.citations.forEach((x) => string(x, "citation", 100));
    unique(c.citations, "citations");
  }
  unique(
    answer.claims.map((c) => normalize(c.text)),
    "claims",
  );
  return answer;
}
export function scoreAnswer(answer, retrievedDocs, expectedFactIds) {
  validateAnswer(answer);
  unique(
    retrievedDocs.map((d) => d.documentId),
    "retrieved documents",
  );
  const map = new Map(retrievedDocs.map((d) => [d.documentId, d]));
  const covered = new Set();
  let validCitations = 0,
    totalCitations = 0;
  const claims = answer.claims.map((c) => {
    // Exact complete sentence attribution only. Caller fact IDs are not accepted.
    const matching = c.citations.filter((id) => {
      const d = map.get(id);
      if (!d) return false;
      return d.text
        .split(/(?<=[.!?؟])\s+/u)
        .some((s) => normalize(s) === normalize(c.text));
    });
    for (const id of matching)
      for (const f of map.get(id).facts)
        if (normalize(f.text) === normalize(c.text)) covered.add(f.factId);
    totalCitations += c.citations.length;
    validCitations += matching.length;
    return {
      ...c,
      exactQuoteSupported: matching.length > 0,
      supportingDocumentIds: matching,
      reason: matching.length
        ? "exact_sentence_in_retrieved_source"
        : "unverified_text_or_invalid_citation",
    };
  });
  return {
    quoteSupportRate: claims.length
      ? claims.filter((c) => c.exactQuoteSupported).length / claims.length
      : null,
    citationPrecision: totalCitations
      ? validCitations / totalCitations
      : claims.length
        ? 0
        : null,
    factCoverage: expectedFactIds.length
      ? expectedFactIds.filter((id) => covered.has(id)).length /
        expectedFactIds.length
      : null,
    claims,
    semanticEntailment: "not_measured",
  };
}
export function extractAnswer(documents) {
  const seen = new Set(),
    claims = [];
  for (const d of documents)
    for (const s of d.text.split(/(?<=[.!?؟])\s+/u)) {
      if (!seen.has(normalize(s)) && claims.length < 30) {
        seen.add(normalize(s));
        claims.push({ text: s, citations: [d.documentId] });
      }
    }
  return { abstained: claims.length === 0, claims };
}
export function conflicts(documents) {
  const topics = new Map();
  for (const d of documents)
    for (const f of d.facts) {
      if (!topics.has(f.topic)) topics.set(f.topic, new Set());
      topics.get(f.topic).add(f.value);
    }
  return [...topics].filter(([, v]) => v.size > 1).map(([topic]) => topic);
}
export function evaluateEvidence(testCase, dataset, ranking, answer, config) {
  unique(
    ranking.map((x) => x.documentId),
    "ranking",
  );
  ensure(ranking.length <= config.k, "ranking exceeds k");
  const map = new Map(dataset.documents.map((d) => [d.documentId, d]));
  ensure(
    ranking.every(
      (r) =>
        map.has(r.documentId) &&
        testCase.allowedScopes.includes(map.get(r.documentId).scope),
    ),
    "retrieved source outside authorized corpus",
  );
  const docs = ranking.map((r) => map.get(r.documentId));
  const findings = [
    ...scan(testCase.question),
    ...docs.flatMap((d) => scan(d.text)),
  ];
  const conflictTopics = conflicts(docs);
  const scores = scoreAnswer(answer, docs, testCase.expectedFactIds);
  let outcome = findings.length
    ? "block"
    : conflictTopics.length
      ? "review"
      : answer.abstained
        ? "abstain"
        : scores.quoteSupportRate === 1 && scores.citationPrecision === 1
          ? "answer"
          : "review";
  return {
    caseId: testCase.caseId,
    question: testCase.question,
    language: testCase.language,
    tags: testCase.tags,
    expectedOutcome: testCase.expectedOutcome,
    outcome,
    outcomeCorrect: outcome === testCase.expectedOutcome,
    retrieval: scoreRetrieval(ranking, testCase.relevantDocumentIds, config.k),
    answer: scores,
    rankedDocuments: ranking.map((r) => ({ ...r, ...map.get(r.documentId) })),
    findings,
    conflictTopics,
  };
}
export const POLICY = Object.freeze({
  version: "p11-local-v2",
  thresholds: {
    recallAtK: 0.8,
    quoteSupportRate: 1,
    citationPrecision: 1,
    factCoverage: 0.8,
    outcomeAccuracy: 0.9,
  },
  sliceMinimumOutcomeAccuracy: 0.75,
  maxUnexpectedBlocks: 0,
  regressionTolerance: 0.02,
});
export function aggregateResults(results, policy = POLICY) {
  ensure(results.length > 0, "results required");
  unique(
    results.map((x) => x.caseId),
    "result cases",
  );
  const metricNames = [
    "precisionAtK",
    "recallAtK",
    "mrr",
    "ndcgAtK",
    "quoteSupportRate",
    "citationPrecision",
    "factCoverage",
  ];
  const metrics = {};
  const denominators = {};
  for (const name of metricNames) {
    const xs = results
      .map((r) => r.retrieval[name] ?? r.answer[name])
      .filter((x) => x !== null && x !== undefined);
    xs.forEach((x) => unit(x, name));
    metrics[name] = mean(xs);
    denominators[name] = xs.length;
  }
  metrics.outcomeAccuracy = mean(results.map((r) => Number(r.outcomeCorrect)));
  denominators.outcomeAccuracy = results.length;
  const unexpectedBlocks = results.filter(
    (r) => r.outcome === "block" && r.expectedOutcome !== "block",
  ).length;
  const groups = new Map();
  for (const r of results)
    for (const tag of [`language:${r.language}`, ...r.tags]) {
      if (!groups.has(tag)) groups.set(tag, []);
      groups.get(tag).push(r);
    }
  const slices = [...groups].map(([name, rs]) => ({
    name,
    count: rs.length,
    outcomeAccuracy: mean(rs.map((r) => Number(r.outcomeCorrect))),
  }));
  const failures = [];
  for (const [name, threshold] of Object.entries(policy.thresholds)) {
    unit(threshold, "threshold");
    if (
      metrics[name] === null ||
      metrics[name] === undefined ||
      metrics[name] < threshold
    )
      failures.push(`${name} below ${threshold}`);
  }
  if (unexpectedBlocks > policy.maxUnexpectedBlocks)
    failures.push("unexpected safety blocks");
  for (const s of slices)
    if (s.outcomeAccuracy < policy.sliceMinimumOutcomeAccuracy)
      failures.push(
        `slice ${s.name} below ${policy.sliceMinimumOutcomeAccuracy}`,
      );
  return {
    caseCount: results.length,
    evaluatedCount: results.length,
    unexpectedBlocks,
    metrics,
    denominators,
    slices,
    passed: failures.length === 0,
    failures,
  };
}
export function compareRegression(
  candidate,
  baseline,
  tolerance = POLICY.regressionTolerance,
) {
  unit(tolerance, "tolerance");
  ensure(
    candidate.datasetHash === baseline.datasetHash,
    "baseline dataset mismatch",
  );
  ensure(
    candidate.policyHash === baseline.policyHash,
    "baseline policy mismatch",
  );
  ensure(
    candidate.engineVersion === baseline.engineVersion,
    "baseline evaluator mismatch",
  );
  const cm = candidate.summary.metrics,
    bm = baseline.summary.metrics;
  ensure(
    Object.keys(cm).sort().join() === Object.keys(bm).sort().join(),
    "baseline metric schema mismatch",
  );
  const deltas = {},
    regressions = [];
  for (const name of Object.keys(bm)) {
    const a = cm[name],
      b = bm[name];
    if (a === null || b === null) {
      ensure(a === b, "baseline denominator mismatch");
      deltas[name] = null;
      continue;
    }
    unit(a, name);
    unit(b, name);
    deltas[name] = a - b;
    if (a - b < -tolerance - 1e-12) regressions.push(name);
  }
  return { passed: regressions.length === 0, tolerance, deltas, regressions };
}
export function pairedBootstrap(candidate, baseline, iterations = 600) {
  ensure(
    candidate.results.length === baseline.results.length,
    "paired sample mismatch",
  );
  integer(iterations, 100, 5000, "iterations");
  const b = new Map(baseline.results.map((r) => [r.caseId, r]));
  ensure(
    candidate.results.every((r) => b.has(r.caseId)),
    "paired identity mismatch",
  );
  const ds = candidate.results.map(
    (r) => Number(r.outcomeCorrect) - Number(b.get(r.caseId).outcomeCorrect),
  );
  let seed = 42;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const samples = Array.from({ length: iterations }, () =>
    mean(ds.map(() => ds[Math.floor(random() * ds.length)])),
  ).sort((a, b) => a - b);
  return {
    metric: "outcomeAccuracyDelta",
    estimate: mean(ds),
    lower: samples[Math.floor(0.025 * iterations)],
    upper: samples[Math.floor(0.975 * iterations)],
    iterations,
    seed: 42,
    n: ds.length,
    notice:
      "Paired percentile bootstrap on synthetic cases; correlated cases and small slices limit inference.",
  };
}
