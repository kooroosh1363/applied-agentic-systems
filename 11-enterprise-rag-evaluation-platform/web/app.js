const $ = (id) => document.getElementById(id),
  esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const pct = (v) =>
    v === null || v === undefined ? "N/A" : (v * 100).toFixed(1) + "%",
  delta = (v) =>
    v === null || v === undefined
      ? "—"
      : (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + " pp";
let boot,
  report,
  baseline,
  selectedBaseline = null,
  busy = false;
const labels = {
  precisionAtK: "Precision@K",
  recallAtK: "Recall@K",
  mrr: "MRR",
  ndcgAtK: "nDCG@K",
  quoteSupportRate: "Exact quote support",
  citationPrecision: "Citation precision",
  factCoverage: "Reference fact coverage",
  outcomeAccuracy: "Expected outcome",
};
async function request(path, body) {
  const res = await fetch(
    path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-workbench-token": boot.token,
          },
          body: JSON.stringify(body),
        },
  );
  const value = await res.json();
  if (!res.ok) throw new Error(value.error || `Request failed: ${res.status}`);
  return value;
}
function showError(e) {
  $("error").textContent = e.message;
  $("error").hidden = false;
}
async function work(fn) {
  if (busy) return;
  busy = true;
  $("error").hidden = true;
  $("progress").hidden = false;
  for (const id of ["run", "ablate"]) $(id).disabled = true;
  try {
    await fn();
  } catch (e) {
    showError(e);
  } finally {
    busy = false;
    $("progress").hidden = true;
    for (const id of ["run", "ablate"]) $(id).disabled = false;
  }
}
function tab(name) {
  for (const el of document.querySelectorAll(".tab-panel"))
    el.hidden = el.id !== name;
  for (const el of document.querySelectorAll(".nav-item"))
    el.classList.toggle("active", el.dataset.tab === name);
  if (name === "history") loadHistory().catch(showError);
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (b) tab(b.dataset.tab);
});
function empty() {
  $("metrics").innerHTML = [
    "recallAtK",
    "quoteSupportRate",
    "factCoverage",
    "outcomeAccuracy",
  ]
    .map(
      (k) =>
        `<div class="metric"><div class="metric-label">${labels[k]}</div><div class="metric-value">—</div><div class="metric-note">Awaiting evaluation</div></div>`,
    )
    .join("");
  $("quality-bars").innerHTML = [
    "precisionAtK",
    "recallAtK",
    "mrr",
    "ndcgAtK",
    "quoteSupportRate",
    "factCoverage",
  ]
    .map(
      (k) =>
        `<div class="bar-row"><div class="bar-label">${labels[k]}</div><div class="tracks"><div class="track"></div><div class="track"></div></div><div class="bar-value">—</div></div>`,
    )
    .join("");
  $("slices").innerHTML = [
    "English",
    "Persian",
    "Unanswerable",
    "Conflicting evidence",
  ]
    .map(
      (x) =>
        `<div class="slice"><div class="slice-top">${x}<span>—</span></div><p>Run to inspect slice quality</p></div>`,
    )
    .join("");
}
function render() {
  const m = report.summary.metrics,
    d = report.regression?.deltas || {};
  $("metrics").innerHTML = [
    "recallAtK",
    "quoteSupportRate",
    "factCoverage",
    "outcomeAccuracy",
  ]
    .map(
      (k) =>
        `<div class="metric"><span class="metric-delta ${d[k] < 0 ? "negative" : ""}">${delta(d[k])}</span><div class="metric-label">${labels[k]}</div><div class="metric-value">${m[k] === null ? "N/A" : (m[k] * 100).toFixed(1) + "<small>%</small>"}</div><div class="metric-note">${report.summary.denominators[k]} applicable cases · vs. baseline</div></div>`,
    )
    .join("");
  $("quality-bars").innerHTML = [
    "precisionAtK",
    "recallAtK",
    "mrr",
    "ndcgAtK",
    "quoteSupportRate",
    "factCoverage",
  ]
    .map(
      (k) =>
        `<div class="bar-row"><div class="bar-label">${labels[k]}<small>n = ${report.summary.denominators[k]}</small></div><div class="tracks"><div class="track"><div class="fill" data-width="${baseline?.summary.metrics[k] ?? (m[k] === null ? 0 : m[k] - (d[k] || 0))}"></div></div><div class="track"><div class="fill candidate" data-width="${m[k] ?? 0}"></div></div></div><div class="bar-value">${pct(m[k])}</div></div>`,
    )
    .join("");
  for (const e of document.querySelectorAll("[data-width]"))
    e.style.width =
      Math.min(1, Math.max(0, Number(e.dataset.width))) * 100 + "%";
  const pass = report.releaseDecision === "eligible_for_human_review",
    reg = report.regression;
  $("decision").innerHTML =
    `<div class="eyebrow">RELEASE GATE</div><div class="decision-state ${pass ? "" : "blocked"}">${pass ? "✓ ELIGIBLE FOR REVIEW" : "× RELEASE BLOCKED"}</div><h2>${pass ? "The candidate meets policy." : "This change needs attention."}</h2><p>${pass ? "Quality and regression checks pass on this synthetic set. Human approval is still required." : "Inspect the failed gate and its source evidence before promoting this candidate."}</p><div class="gate-line">Quality & slice gates <span class="${report.summary.passed ? "pass" : "fail"}">${report.summary.passed ? "PASS" : "FAIL"}</span></div><div class="gate-line">Baseline regression <span class="${reg?.passed ? "pass" : "fail"}">${reg ? (reg.passed ? "PASS" : "FAIL") : "NOT COMPARED"}</span></div><div class="gate-line">Unexpected safety blocks <span>${report.summary.unexpectedBlocks}</span></div><div class="gate-line">Human approval <span>REQUIRED</span></div>${!pass ? `<ul class="failure-list">${[...report.summary.failures, ...(reg?.regressions || []).map((k) => `${labels[k] || k} regressed`)].map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}<p class="footnote">${report.interval ? `Outcome delta ${delta(report.interval.estimate)} · 95% paired bootstrap [${delta(report.interval.lower)}, ${delta(report.interval.upper)}]. Synthetic, correlated cases.` : "Stored baseline evaluation; no promotion decision."}</p>`;
  $("slices").innerHTML = report.summary.slices
    .map(
      (s) =>
        `<div class="slice"><div class="slice-top"><span>${esc(s.name)}</span><strong class="${s.outcomeAccuracy >= 0.75 ? "pass" : "fail"}">${pct(s.outcomeAccuracy)}</strong></div><p>${s.count} cases · expected-outcome accuracy</p></div>`,
    )
    .join("");
  $("run-meta").textContent =
    `Run ${report.runId.slice(0, 8)} · ${report.evidence.execution} · ${report.totalLatencyMs.toFixed(0)} ms · dataset ${report.datasetHash.slice(0, 10)}`;
  $("exports").hidden = false;
  renderCases();
}
function renderCases() {
  if (!report) return;
  const f = $("case-filter").value;
  const changed = new Set((report.changedCases || []).map((c) => c.caseId));
  const rows = report.results.filter(
    (r) =>
      f === "all" ||
      (f === "failed" && !r.outcomeCorrect) ||
      (f === "changed" && changed.has(r.caseId)) ||
      r.language === f,
  );
  $("case-list").innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<button class="case-item" data-case="${esc(r.caseId)}"><span class="pill ${esc(r.outcome)}">${esc(r.outcome)}</span><strong>${esc(r.caseId)}</strong><p dir="auto">${esc(r.question)}</p></button>`,
        )
        .join("")
    : '<div class="empty-state">No matching cases</div>';
  if (rows.length) detail(rows[0].caseId);
  else
    $("case-detail").innerHTML =
      '<div class="empty-state">No matching cases.</div>';
}
function detail(id) {
  const r = report.results.find((r) => r.caseId === id);
  if (!r) return;
  for (const e of document.querySelectorAll("[data-case]"))
    e.classList.toggle("active", e.dataset.case === id);
  $("case-detail").innerHTML =
    `<div class="eyebrow">${esc(r.caseId)}</div><div class="case-question" dir="auto">${esc(r.question)}</div><p class="detail-meta">Expected: ${esc(r.expectedOutcome)} · Observed: ${esc(r.outcome)} · ${r.outcomeCorrect ? "Correct outcome" : "Unexpected outcome"}<br>Recall ${pct(r.retrieval.recallAtK)} · Fact coverage ${pct(r.answer.factCoverage)} · ${r.latencyMs} ms</p>${r.findings.length ? `<div class="evidence-card invalid">Safety finding: ${esc(r.findings.join(", "))}</div>` : ""}${r.conflictTopics.length ? `<div class="evidence-card invalid">Conflicting source metadata: ${esc(r.conflictTopics.join(", "))}</div>` : ""}<div class="detail-heading">CANDIDATE CLAIMS / EXACT QUOTE CHECK</div>${r.answer.claims.length ? r.answer.claims.map((c) => `<div class="evidence-card ${c.exactQuoteSupported ? "" : "invalid"}"><small>${c.exactQuoteSupported ? "✓ EXACT SOURCE QUOTE" : "× UNVERIFIED CLAIM"}</small><p dir="auto">${esc(c.text)}</p><div class="detail-meta">Citations: ${esc(c.citations.join(", ") || "none")}<br>${esc(c.reason)}</div></div>`).join("") : "<p>No answer claims were released.</p>"}<div class="detail-heading">RETRIEVED SOURCES</div>${r.rankedDocuments.length ? r.rankedDocuments.map((d, i) => `<div class="evidence-card"><small>${i + 1} / ${esc(d.documentId)} · score ${d.score.toFixed(3)}</small><h3 dir="auto">${esc(d.title)}</h3><p dir="auto">${esc(d.text)}</p><div class="detail-meta">${esc(d.sourceUri)} · version ${esc(d.version)}</div></div>`).join("") : "<p>No sources retrieved.</p>"}`;
}
$("case-list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-case]");
  if (b) detail(b.dataset.case);
});
$("case-filter").addEventListener("change", renderCases);
$("run").addEventListener("click", () =>
  work(async () => {
    const config = {
      retriever: $("retriever").value,
      k: Number($("top-k").value),
      fault: $("fault").value,
      generator: $("generator").value,
      rerank: $("rerank").checked,
      minQueryCoverage: Number($("coverage").value),
    };
    const pair = await request("/api/evaluate", {
      config,
      ...(selectedBaseline ? { baselineRunId: selectedBaseline } : {}),
    });
    report = pair.candidate;
    baseline = pair.baseline;
    render();
  }),
);
$("ablate").addEventListener("click", () =>
  work(async () => {
    const { runs } = await request("/api/ablation", {});
    $("ablation-results").className = "";
    $("ablation-results").innerHTML =
      `<table class="data-table"><thead><tr><th>Variant</th><th>Recall</th><th>Precision@K</th><th>Outcomes</th><th>Decision</th><th></th></tr></thead><tbody>${runs.map((r) => `<tr><td>${esc(r.config.retriever)} / K=${r.config.k}${r.config.rerank ? " / phrase rerank" : ""}</td><td>${pct(r.summary.metrics.recallAtK)}</td><td>${pct(r.summary.metrics.precisionAtK)}</td><td>${pct(r.summary.metrics.outcomeAccuracy)}</td><td>${r.releaseDecision === "blocked" ? "Blocked" : "Human review"}</td><td><button class="text-button" data-open="${r.runId}">Inspect ↗</button></td></tr>`).join("")}</tbody></table>`;
  }),
);
async function loadHistory() {
  const runs = await request("/api/runs");
  $("history-list").className = runs.length ? "" : "empty-state";
  $("history-list").innerHTML = runs.length
    ? `<table class="data-table"><thead><tr><th>Run / time</th><th>Configuration</th><th>Outcomes</th><th>Gate</th><th>Actions</th></tr></thead><tbody>${runs.map((r) => `<tr><td>${esc(r.runId.slice(0, 8))}<br><span class="muted">${esc(new Date(r.createdAt).toLocaleString())}</span></td><td>${esc(r.config.retriever)} / K=${r.config.k}<br><span class="muted">${esc(r.config.fault)}</span></td><td>${pct(r.summary.metrics.outcomeAccuracy)}</td><td>${esc(r.releaseDecision || "baseline")}</td><td><button class="text-button" data-open="${r.runId}">Open</button><button class="text-button" data-baseline="${r.runId}">Use as baseline</button></td></tr>`).join("")}</tbody></table>`
    : "No saved runs yet.";
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-open]");
  const a = e.target.closest("[data-baseline]");
  const ex = e.target.closest("[data-export]");
  try {
    if (b) {
      report = await request("/api/runs/" + b.dataset.open);
      baseline = report.baselineRunId
        ? await request("/api/runs/" + report.baselineRunId)
        : report;
      render();
      tab("overview");
    }
    if (a) {
      selectedBaseline = a.dataset.baseline;
      $("baseline-label").textContent =
        "Baseline: saved run " + selectedBaseline.slice(0, 8);
      $("clear-baseline").hidden = false;
      tab("overview");
    }
    if (ex && report) {
      const link = document.createElement("a");
      link.href = `/api/runs/${report.runId}/${ex.dataset.export}`;
      link.download = "";
      document.body.append(link);
      link.click();
      link.remove();
    }
  } catch (error) {
    showError(error);
  }
});
$("clear-baseline").addEventListener("click", () => {
  selectedBaseline = null;
  $("baseline-label").textContent = "Baseline: BM25 / K=2 / extractive";
  $("clear-baseline").hidden = true;
});
$("refresh-history").addEventListener("click", () =>
  loadHistory().catch(showError),
);
$("record-mode").addEventListener("click", () => {
  document.body.classList.toggle("focus");
  $("record-mode").textContent = document.body.classList.contains("focus")
    ? "Exit focus"
    : "Focus mode";
});
$("judge").addEventListener("click", () =>
  work(async () => {
    if (!report) throw new Error("Run an evaluation first");
    const value = await request("/api/judge", { runId: report.runId });
    $("judge-results").innerHTML =
      `<p>Advisory judge: ${esc(value.model)}. Release decision unchanged.</p><table class="data-table"><thead><tr><th>Claim</th><th>Model label</th></tr></thead><tbody>${value.rows.map((r) => `<tr><td>${esc(r.claim)}</td><td>${esc(r.predicted)}</td></tr>`).join("")}</tbody></table>`;
  }),
);
$("calibrate").addEventListener("click", () =>
  work(async () => {
    const file = $("calibration-file").files[0];
    if (!file) throw new Error("Choose independent human-label JSON first");
    if (file.size > 60000) throw new Error("Calibration file exceeds 60 KB");
    const rows = JSON.parse(await file.text());
    $("calibration-results").textContent = JSON.stringify(
      await request("/api/calibrate", { rows }),
      null,
      2,
    );
  }),
);
empty();
try {
  boot = await request("/api/bootstrap");
  $("case-count").textContent = boot.dataset.cases.length;
  $("dataset-label").textContent =
    `${boot.dataset.cases.length} CASES / ${boot.dataset.documents.length} SOURCES / EN + FA`;
  $("engine-label").textContent =
    `Engine ${boot.engineVersion} · ${boot.store}`;
  for (const [id, value, enabled, label] of [
    [
      "retriever",
      "embedding",
      boot.capabilities.embedding,
      "Local embeddings · Ollama",
    ],
    ["generator", "ollama", boot.capabilities.generation, "Local LLM · Ollama"],
  ]) {
    const option = $(id).querySelector(`option[value="${value}"]`);
    if (enabled) {
      option.disabled = false;
      option.textContent = label;
    }
  }
  if (boot.capabilities.judge) {
    $("judge").disabled = false;
    $("judge").textContent = "Run advisory judge ↗";
  }
} catch (e) {
  showError(e);
  $("run").disabled = true;
}
