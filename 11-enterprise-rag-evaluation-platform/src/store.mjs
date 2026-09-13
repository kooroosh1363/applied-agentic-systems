import {
  mkdir,
  readFile,
  readdir,
  writeFile,
  link,
  unlink,
} from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { ensure, fingerprint } from "./core.mjs";
export class FileStore {
  constructor(directory) {
    this.directory = directory;
    this.kind = "local-atomic-files";
  }
  async init() {
    await mkdir(this.directory, { recursive: true });
    return this;
  }
  async save(report) {
    const id = report.runId;
    ensure(/^[a-f0-9-]{36}$/.test(id), "invalid run ID");
    const envelope = { report, checksum: fingerprint(report) };
    const temp = join(this.directory, `.${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify(envelope), {
      flag: "wx",
      mode: 0o600,
    });
    try {
      await link(temp, join(this.directory, id + ".json"));
    } finally {
      await unlink(temp).catch(() => {});
    }
    return id;
  }
  async get(id) {
    ensure(/^[a-f0-9-]{36}$/.test(id), "invalid run ID");
    const data = JSON.parse(
      await readFile(join(this.directory, id + ".json"), "utf8"),
    );
    ensure(
      data.checksum === fingerprint(data.report),
      "stored report checksum mismatch",
    );
    return data.report;
  }
  async list() {
    const files = (await readdir(this.directory)).filter((f) =>
      /^[a-f0-9-]{36}\.json$/.test(f),
    );
    const reports = [];
    for (const f of files) {
      const r = await this.get(f.slice(0, -5));
      reports.push({
        runId: r.runId,
        createdAt: r.createdAt,
        config: r.config,
        releaseDecision: r.releaseDecision,
        summary: r.summary,
      });
    }
    return reports
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 100);
  }
  async close() {}
}
export class PostgresStore {
  constructor(pool) {
    this.pool = pool;
    this.kind = "postgresql";
  }
  async init() {
    await this.pool.query("SELECT run_id FROM p11_reports LIMIT 0");
    return this;
  }
  async save(report) {
    await this.pool.query(
      "INSERT INTO p11_reports (run_id,dataset_id,dataset_version,dataset_hash,report,checksum) VALUES ($1,$2,$3,$4,$5,$6)",
      [
        report.runId,
        report.datasetId,
        report.datasetVersion,
        report.datasetHash,
        JSON.stringify(report),
        fingerprint(report),
      ],
    );
    return report.runId;
  }
  async get(id) {
    ensure(/^[a-f0-9-]{36}$/.test(id), "invalid run ID");
    const { rows } = await this.pool.query(
      "SELECT report,checksum FROM p11_reports WHERE run_id=$1",
      [id],
    );
    ensure(rows.length === 1, "run not found");
    ensure(
      rows[0].checksum === fingerprint(rows[0].report),
      "stored report checksum mismatch",
    );
    return rows[0].report;
  }
  async list() {
    const { rows } = await this.pool.query(
      "SELECT report FROM p11_reports ORDER BY created_at DESC LIMIT 100",
    );
    return rows.map(({ report: r }) => ({
      runId: r.runId,
      createdAt: r.createdAt,
      config: r.config,
      releaseDecision: r.releaseDecision,
      summary: r.summary,
    }));
  }
  async close() {
    await this.pool.end();
  }
}
export async function createStore(env = process.env) {
  if (env.DATABASE_URL) {
    const { default: pg } = await import("pg");
    return new PostgresStore(
      new pg.Pool({ connectionString: env.DATABASE_URL, max: 4 }),
    ).init();
  }
  return new FileStore(
    env.P11_DATA_DIR || fileURLToPath(new URL("../data/", import.meta.url)),
  ).init();
}
