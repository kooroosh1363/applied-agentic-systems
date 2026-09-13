const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const csv = (s) =>
  '"' +
  String(s ?? "")
    .replace(/^[=+@\-\t\r]/, "'$&")
    .replaceAll('"', '""') +
  '"';
export function exportCSV(r) {
  return [
    [
      "caseId",
      "language",
      "expected",
      "actual",
      "outcomeCorrect",
      "recallAtK",
      "quoteSupportRate",
      "factCoverage",
    ],
    ...r.results.map((c) => [
      c.caseId,
      c.language,
      c.expectedOutcome,
      c.outcome,
      c.outcomeCorrect,
      c.retrieval.recallAtK,
      c.answer.quoteSupportRate,
      c.answer.factCoverage,
    ]),
  ]
    .map((row) => row.map(csv).join(","))
    .join("\r\n");
}
export function exportHTML(r) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>RAG evaluation ${escape(r.runId)}</title><style>body{font:16px system-ui;max-width:1100px;margin:48px auto;color:#202030}table{border-collapse:collapse;width:100%}td,th{padding:12px;border-bottom:1px solid #ddd;text-align:left}code{word-break:break-all}small{color:#555}</style><h1>RAG evaluation report</h1><p>${escape(r.releaseDecision || "evaluation_only")}</p><p>Run <code>${escape(r.runId)}</code></p><p>Dataset <code>${escape(r.datasetHash)}</code></p><p>Synthetic dataset · ${escape(r.evidence.execution)} · Semantic entailment: not measured</p><h2>Metrics</h2><table>${Object.entries(
    r.summary.metrics,
  )
    .map(
      ([k, v]) =>
        `<tr><td>${escape(k)}</td><td>${v === null ? "N/A" : (v * 100).toFixed(1) + "%"}</td></tr>`,
    )
    .join(
      "",
    )}</table><h2>Case evidence</h2>${r.results.map((c) => `<article><h3>${escape(c.caseId)} · ${escape(c.outcome)}</h3><p dir="auto">${escape(c.question)}</p>${c.answer.claims.map((x) => `<p dir="auto">${escape(x.text)}<br><small>${escape(x.reason)} · ${escape(x.citations.join(", "))}</small></p>`).join("")}</article>`).join("")}<h2>Limitations</h2>${r.notices.map((n) => `<p>${escape(n)}</p>`).join("")}</html>`;
}
