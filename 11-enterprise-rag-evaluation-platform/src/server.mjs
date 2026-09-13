import http from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  ensure,
  keys,
  string,
  validateConfig,
  ENGINE_VERSION,
} from "./core.mjs";
import { runComparison, runAblation, advisoryJudge } from "./runner.mjs";
import { createStore } from "./store.mjs";
import { localModelConfig, calibrateJudge } from "./adapters.mjs";
import { exportCSV, exportHTML } from "./exports.mjs";
const datasetPath = new URL(
  "../examples/evaluation-fixture.json",
  import.meta.url,
);
const assets = new Map([
  ["/", ["index.html", "text/html"]],
  ["/app.js", ["app.js", "text/javascript"]],
  ["/style.css", ["style.css", "text/css"]],
]);
const security = {
  "x-content-type-options": "nosniff",
  "cache-control": "no-store",
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  "referrer-policy": "no-referrer",
};
export async function createServer(options = {}) {
  const dataset = options.dataset || JSON.parse(await readFile(datasetPath));
  const store = options.store || (await createStore());
  const token = randomBytes(32).toString("hex"),
    model = options.modelConfig || localModelConfig();
  let active = false,
    completed = 0,
    failed = 0;
  const authorized = (req) => {
    const provided =
      req.headers["x-workbench-token"] ||
      req.headers.authorization?.replace(/^Bearer /, "");
    const accepted = [
      token,
      ...(process.env.P11_API_TOKEN ? [process.env.P11_API_TOKEN] : []),
    ];
    return (
      typeof provided === "string" &&
      accepted.some(
        (t) =>
          provided.length === t.length &&
          timingSafeEqual(Buffer.from(provided), Buffer.from(t)),
      )
    );
  };
  const send = (res, status, body, type = "application/json") => {
    res.writeHead(status, {
      ...security,
      "content-type": type + "; charset=utf-8",
    });
    res.end(type === "application/json" ? JSON.stringify(body) : body);
  };
  const server = http.createServer(async (req, res) => {
    const host = req.headers.host || "";
    const hostName = host.replace(/:\d+$/, "");
    if (!["127.0.0.1", "localhost", "[::1]"].includes(hostName))
      return send(res, 403, { error: "Untrusted host" });
    if (req.headers.origin && req.headers.origin !== `http://${host}`)
      return send(res, 403, { error: "Cross-origin request rejected" });
    try {
      const url = new URL(req.url, `http://${host}`),
        path = url.pathname;
      if (req.method === "GET" && assets.has(path)) {
        const [file, type] = assets.get(path);
        return send(
          res,
          200,
          await readFile(new URL("../web/" + file, import.meta.url), "utf8"),
          type,
        );
      }
      if (req.method === "GET" && path === "/health")
        return send(res, 200, {
          status: "ok",
          engineVersion: ENGINE_VERSION,
          evidenceMode: "synthetic",
          store: store.kind,
        });
      if (req.method === "GET" && path === "/metrics")
        return send(
          res,
          200,
          `# TYPE p11_runs_completed_total counter\np11_runs_completed_total ${completed}\n# TYPE p11_runs_failed_total counter\np11_runs_failed_total ${failed}\n# TYPE p11_evaluation_active gauge\np11_evaluation_active ${Number(active)}\n`,
          "text/plain",
        );
      if (req.method === "GET" && path === "/api/bootstrap")
        return send(res, 200, {
          token,
          dataset,
          capabilities: {
            embedding: Boolean(model.embeddingModel),
            generation: Boolean(model.generationModel),
            judge: Boolean(model.judgeModel),
          },
          store: store.kind,
          engineVersion: ENGINE_VERSION,
        });
      if (req.method === "GET" && path === "/api/runs")
        return send(res, 200, await store.list());
      const match = path.match(
        /^\/api\/runs\/([a-f0-9-]{36})(?:\/(json|csv|html))?$/,
      );
      if (req.method === "GET" && match) {
        const r = await store.get(match[1]);
        if (match[2])
          res.setHeader(
            "content-disposition",
            `attachment; filename="rag-evaluation-${r.runId}.${match[2]}"`,
          );
        return send(
          res,
          200,
          match[2] === "csv"
            ? exportCSV(r)
            : match[2] === "html"
              ? exportHTML(r)
              : r,
          match[2] === "csv"
            ? "text/csv"
            : match[2] === "html"
              ? "text/html"
              : "application/json",
        );
      }
      if (
        req.method === "POST" &&
        [
          "/evaluate",
          "/api/evaluate",
          "/api/ablation",
          "/api/judge",
          "/api/calibrate",
        ].includes(path)
      ) {
        if (!authorized(req))
          return send(res, 401, { error: "Workbench token required" });
        if (
          !/^application\/json(?:;|$)/i.test(req.headers["content-type"] || "")
        )
          return send(res, 415, { error: "JSON required" });
        if (active)
          return send(res, 429, { error: "One evaluation is already running" });
        active = true;
        try {
          let size = 0;
          const chunks = [];
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 65536) {
              send(res, 413, { error: "Request exceeds 64 KiB" });
              return;
            }
            chunks.push(chunk);
          }
          const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (path === "/api/calibrate") {
            keys(input, ["rows"], "calibration");
            return send(res, 200, calibrateJudge(input.rows));
          }
          if (path === "/api/judge") {
            keys(input, ["runId"], "judge");
            string(input.runId, "run ID", 36);
            return send(
              res,
              200,
              await advisoryJudge(await store.get(input.runId), model),
            );
          }
          if (path === "/api/ablation") {
            keys(input, [], "ablation");
            const runs = await runAblation(dataset);
            for (const r of runs) await store.save(r);
            completed += runs.length;
            return send(res, 200, { runs });
          }
          keys(input, ["config", "baselineRunId"], "evaluation");
          const config = validateConfig(input.config || {});
          let baseline;
          if (input.baselineRunId) {
            string(input.baselineRunId, "baseline ID", 36);
            baseline = await store.get(input.baselineRunId);
          }
          const pair = await runComparison(dataset, config, {
            baseline,
            modelConfig: model,
          });
          if (!baseline) await store.save(pair.baseline);
          await store.save(pair.candidate);
          completed++;
          return send(res, 200, pair);
        } finally {
          active = false;
        }
      }
      return send(res, 404, { error: "Not found" });
    } catch (error) {
      failed++;
      if (!res.headersSent)
        send(res, error.code === "ENOENT" ? 404 : 400, {
          error: error.message,
        });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.closeStore = () => store.close();
  return server;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const server = await createServer();
  const port = Number(process.env.PORT || 8110),
    bind = process.env.P11_BIND || "127.0.0.1";
  ensure(["127.0.0.1", "0.0.0.0"].includes(bind), "Invalid bind address");
  server.listen(port, bind, () =>
    console.log(`RAG Evaluation Workbench: http://localhost:${port}`),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(async () => {
        await server.closeStore();
        process.exit(0);
      }),
    );
}
