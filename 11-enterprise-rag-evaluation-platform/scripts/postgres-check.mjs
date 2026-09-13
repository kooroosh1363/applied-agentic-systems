import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { PostgresStore } from "../src/store.mjs";
import { runComparison } from "../src/runner.mjs";
if (!process.env.DATABASE_URL)
  throw new Error(
    "DATABASE_URL required; use disposable PostgreSQL 16 database",
  );
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const version = (await pool.query("SHOW server_version_num")).rows[0]
    .server_version_num;
  assert.ok(
    Number(version) >= 160000 && Number(version) < 170000,
    "PostgreSQL 16 required",
  );
  await pool.query(
    await readFile(
      new URL("../database/001_init.sql", import.meta.url),
      "utf8",
    ),
  );
  const store = await new PostgresStore(pool).init();
  const dataset = JSON.parse(
    await readFile(
      new URL("../examples/evaluation-fixture.json", import.meta.url),
    ),
  );
  const { candidate } = await runComparison(dataset, { fault: "wrong-number" });
  await store.save(candidate);
  assert.deepEqual(await store.get(candidate.runId), candidate);
  const other = structuredClone(candidate);
  other.runId = crypto.randomUUID();
  other.datasetVersion = "2.0.1";
  await store.save(other);
  assert.equal((await store.get(other.runId)).datasetVersion, "2.0.1");
  await assert.rejects(() => store.save(candidate));
  await pool.query("DELETE FROM p11_reports WHERE run_id=ANY($1::uuid[])", [
    [candidate.runId, other.runId],
  ]);
  console.log(
    "PostgreSQL 16: migration, persistence, version coexistence, duplicate rejection and round-trip passed",
  );
} finally {
  await pool.end();
}
