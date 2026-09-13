import { readFile, writeFile } from "node:fs/promises";
import { runComparison, runAblation } from "../src/runner.mjs";
const dataset = JSON.parse(
  await readFile(
    new URL("../examples/evaluation-fixture.json", import.meta.url),
  ),
);
const clean = (await runComparison(dataset)).candidate;
const wrong = (await runComparison(dataset, { fault: "wrong-number" }))
  .candidate;
const ablations = await runAblation(dataset);
const compact = (r) => ({
  config: r.config,
  metrics: r.summary.metrics,
  failures: r.summary.failures,
  regressions: r.regression.regressions,
  releaseDecision: r.releaseDecision,
});
const report = {
  engineVersion: clean.engineVersion,
  datasetHash: clean.datasetHash,
  policyHash: clean.policyHash,
  evidence: clean.evidence,
  notice:
    "Measured on an authored synthetic development set, not independent holdout evidence.",
  clean: compact(clean),
  wrongNumber: compact(wrong),
  ablations: ablations.map(compact),
};
await writeFile(
  new URL("../benchmarks/local-results.json", import.meta.url),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    wrongNumber: wrong.summary.metrics,
    decision: wrong.releaseDecision,
  }),
);
