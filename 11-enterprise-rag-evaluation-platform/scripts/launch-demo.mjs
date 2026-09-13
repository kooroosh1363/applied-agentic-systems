import { spawn } from "node:child_process";
import { createServer } from "../src/server.mjs";
const server = await createServer();
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? "Port 8110 is busy. Close the other demo or open http://localhost:8110."
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(8110, "127.0.0.1", () => {
  const url = "http://localhost:8110";
  console.log(
    `Evidence Workbench: ${url}\nPress Ctrl+C to stop. Runs are saved in data/.`,
  );
  if (process.platform === "win32")
    spawn("cmd", ["/c", "start", "", url], { stdio: "ignore" }).unref();
});
process.on("SIGINT", () =>
  server.close(async () => {
    await server.closeStore();
    process.exit(0);
  }),
);
