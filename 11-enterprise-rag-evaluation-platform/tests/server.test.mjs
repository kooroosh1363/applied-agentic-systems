import http from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../src/server.mjs";
import { FileStore } from "../src/store.mjs";
let server, base, token, dir;
test.before(async () => {
  dir = await mkdtemp(join(tmpdir(), "p11-api-"));
  server = await createServer({ store: await new FileStore(dir).init() });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + server.address().port;
  token = (await (await fetch(base + "/api/bootstrap")).json()).token;
});
test.after(async () => {
  await new Promise((r) => server.close(r));
  await rm(dir, { recursive: true, force: true });
});
const post = (body, headers = {}) =>
  fetch(base + "/api/evaluate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-workbench-token": token,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
test("HTML and JS served with local-only security headers", async () => {
  const r = await fetch(base + "/");
  assert.equal(r.status, 200);
  assert.match(await r.text(), /RAG Evaluation Workbench/);
  assert.match(
    r.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
  assert.equal((await fetch(base + "/app.js")).status, 200);
});
test("metrics endpoint is live", async () =>
  assert.match(
    await (await fetch(base + "/metrics")).text(),
    /p11_runs_completed_total/,
  ));
test("evaluation requires token", async () =>
  assert.equal((await post({}, { "x-workbench-token": "" })).status, 401));
test("cross-origin and untrusted hosts rejected", async () => {
  assert.equal((await post({}, { origin: "http://evil.example" })).status, 403);
  const status = await new Promise((resolve, reject) => {
    http
      .get(
        base + "/api/bootstrap",
        { headers: { host: "evil.example" } },
        (r) => {
          r.resume();
          resolve(r.statusCode);
        },
      )
      .on("error", reject);
  });
  assert.equal(status, 403);
});
test("JSON, shape and override attacks rejected", async () => {
  for (const body of [
    "{",
    "null",
    { options: { blockUnsafe: false } },
    { documents: [] },
    { config: { retrieved: [] } },
    { config: { k: "2" } },
    { config: { minQueryCoverage: null } },
  ])
    assert.equal((await post(body)).status, 400);
});
test("payload bounded and server survives rejection", async () => {
  assert.equal((await post('"' + "x".repeat(70000) + '"')).status, 413);
  assert.equal((await fetch(base + "/health")).status, 200);
});
test("API performs baseline comparison and persists downloadable report", async () => {
  const r = await post({ config: { fault: "wrong-number" } });
  assert.equal(r.status, 200);
  const pair = await r.json();
  assert.equal(pair.candidate.releaseDecision, "blocked");
  assert.ok(pair.candidate.regression);
  assert.ok(pair.candidate.interval);
  const id = pair.candidate.runId;
  assert.equal(
    (await (await fetch(base + "/api/runs/" + id)).json()).runId,
    id,
  );
  assert.match(
    await (await fetch(base + "/api/runs/" + id + "/csv")).text(),
    /caseId/,
  );
  assert.match(
    await (await fetch(base + "/api/runs/" + id + "/html")).text(),
    /Semantic entailment: not measured/,
  );
  const runs = await (await fetch(base + "/api/runs")).json();
  assert.ok(runs.some((x) => x.runId === id));
  const second = await (
    await post({ config: {}, baselineRunId: pair.baseline.runId })
  ).json();
  assert.equal(second.candidate.baselineRunId, pair.baseline.runId);
});
test("unknown routes and missing reports have explicit responses", async () => {
  assert.equal((await fetch(base + "/unknown")).status, 404);
  assert.equal(
    (await fetch(base + "/api/runs/00000000-0000-0000-0000-000000000000"))
      .status,
    404,
  );
});
