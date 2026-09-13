import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileStore, PostgresStore } from "../src/store.mjs";
import { randomUUID } from "node:crypto";
import { exportHTML, exportCSV } from "../src/exports.mjs";
test("atomic file persistence survives reopening and detects accidental edits", async () => {
  const dir = await mkdtemp(join(tmpdir(), "p11-store-"));
  try {
    const r = {
      runId: randomUUID(),
      createdAt: new Date().toISOString(),
      config: {},
      summary: {},
    };
    const s = await new FileStore(dir).init();
    await s.save(r);
    await assert.rejects(() => s.save(r), /EEXIST/);
    assert.deepEqual(await (await new FileStore(dir).init()).get(r.runId), r);
    const path = join(dir, r.runId + ".json");
    const value = JSON.parse(await readFile(path));
    value.report.config = { tampered: true };
    await writeFile(path, JSON.stringify(value));
    await assert.rejects(() => s.get(r.runId), /checksum/);
    await assert.rejects(() => s.get("../other"), /invalid/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("PostgreSQL adapter uses bound parameters and fails missing run", async () => {
  const calls = [];
  const p = {
    query: async (sql, args) => {
      calls.push({ sql, args });
      return { rows: [] };
    },
    end: async () => {},
  };
  const s = await new PostgresStore(p).init();
  await s.save({
    runId: randomUUID(),
    datasetId: "test",
    datasetVersion: "2",
    datasetHash: "a".repeat(64),
  });
  assert.ok(calls.at(-1).sql.includes("$6"));
  assert.equal(calls.at(-1).args.length, 6);
  await assert.rejects(() => s.get(randomUUID()), /not found/);
});
test("exports escape executable HTML and CSV formula payloads", () => {
  const r = {
    runId: "x",
    datasetHash: "x",
    evidence: { execution: "local" },
    summary: { metrics: {} },
    notices: [],
    results: [
      {
        caseId: "=1+1",
        question: "<script>alert(1)</script>",
        answer: { claims: [] },
        retrieval: {},
        language: "en",
      },
    ],
  };
  assert.ok(!exportHTML(r).includes("<script>"));
  assert.ok(exportHTML(r).includes("&lt;script&gt;"));
  assert.ok(exportCSV(r).includes("'=1+1"));
});
