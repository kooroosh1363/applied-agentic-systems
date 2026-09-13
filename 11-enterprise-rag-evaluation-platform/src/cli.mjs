import { readFile, writeFile, mkdir } from "node:fs/promises";
import { runComparison, runAblation } from "./runner.mjs";
const d = JSON.parse(
  await readFile(
    new URL("../examples/evaluation-fixture.json", import.meta.url),
  ),
);
const command = process.argv[2] || "evaluate";
if (command === "ablation")
  console.log(
    JSON.stringify(
      (await runAblation(d)).map((r) => ({
        config: r.config,
        metrics: r.summary.metrics,
        releaseDecision: r.releaseDecision,
      })),
      null,
      2,
    ),
  );
else {
  const pair = await runComparison(d, {
    fault: process.argv.includes("--fault") ? "wrong-number" : "none",
  });
  await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true });
  await writeFile(
    new URL("../artifacts/latest.json", import.meta.url),
    JSON.stringify(pair, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        runId: pair.candidate.runId,
        summary: pair.candidate.summary,
        regression: pair.candidate.regression,
        releaseDecision: pair.candidate.releaseDecision,
        evidence: pair.candidate.evidence,
      },
      null,
      2,
    ),
  );
  if (pair.candidate.releaseDecision === "blocked") process.exitCode = 1;
}
