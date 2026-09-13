import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import vm from "node:vm";
const dir = new URL("../workflows/", import.meta.url);
test("n8n exports have connected nodes and use shared API, not independent scores", async () => {
  const files = (await readdir(dir)).filter((x) => x.endsWith(".json"));
  assert.equal(files.length, 4);
  for (const f of files) {
    const w = JSON.parse(await readFile(new URL(f, dir)));
    assert.equal(w.active, false);
    const names = new Set(w.nodes.map((n) => n.name));
    assert.equal(names.size, w.nodes.length);
    for (const [from, v] of Object.entries(w.connections)) {
      assert.ok(names.has(from));
      for (const branches of v.main)
        for (const edge of branches) assert.ok(names.has(edge.node));
    }
    assert.ok(w.nodes.some((n) => n.type === "n8n-nodes-base.httpRequest"));
  }
});
test("n8n release decision cannot bypass a failing quality gate", async () => {
  const w = JSON.parse(
    await readFile(new URL("regression-release-gate.json", dir)),
  );
  const script = w.nodes.at(-1).parameters.jsCode;
  const execute = (input) =>
    vm.runInNewContext(`(function(){${script}})()`, { $json: input });
  assert.throws(() => execute({}));
  const r = execute({
    runId: "x",
    regression: { passed: true },
    summary: { passed: false },
    humanApprovalRequired: true,
    releaseDecision: "eligible_for_human_review",
  });
  assert.equal(r[0].json.releaseDecision, "blocked");
  assert.equal(r[0].json.autoPromote, false);
});
