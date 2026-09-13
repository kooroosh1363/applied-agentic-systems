import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../src/server.mjs";
import { FileStore } from "../src/store.mjs";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const dir = await mkdtemp(join(tmpdir(), "p11-browser-"));
const s = await createServer({ store: await new FileStore(dir).init() });
await new Promise((r) => s.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_EXECUTABLE
    ? { executablePath: process.env.BROWSER_EXECUTABLE }
    : {}),
  args: ["--no-sandbox", "--disable-gpu", "--disable-software-rasterizer"],
});
const root = new URL("../artifacts/browser/", import.meta.url);
await mkdir(root, { recursive: true });
try {
  const p = await browser.newPage({
    viewport: { width: 1536, height: 1000 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:" + s.address().port);
  await p.click("#run");
  await p.waitForFunction(() =>
    document
      .querySelector("#decision")
      .textContent.includes("ELIGIBLE FOR REVIEW"),
  );
  await p.screenshot({
    path: new URL("clean.png", root).pathname,
    fullPage: true,
  });
  await p.selectOption("#fault", "wrong-number");
  await p.click("#run");
  await p.waitForFunction(() =>
    document.querySelector("#decision").textContent.includes("RELEASE BLOCKED"),
  );
  await p.screenshot({
    path: new URL("blocked.png", root).pathname,
    fullPage: true,
  });
  await p.locator('.nav-item[data-tab="cases"]').click();
  await p.selectOption("#case-filter", "changed");
  assert.ok(
    await p
      .locator("#case-detail")
      .textContent()
      .then((t) => t.includes("999")),
  );
  await p.screenshot({
    path: new URL("evidence.png", root).pathname,
    fullPage: true,
  });
  await p.selectOption("#case-filter", "fa");
  assert.ok(
    await p
      .locator(".case-question")
      .textContent()
      .then((t) => /[\u0600-\u06ff]/.test(t)),
  );
  await p.screenshot({
    path: new URL("persian.png", root).pathname,
    fullPage: true,
  });
  await p.locator('.nav-item[data-tab="experiments"]').click();
  await p.click("#ablate");
  await p.waitForSelector("#ablation-results tbody tr");
  assert.equal(await p.locator("#ablation-results tbody tr").count(), 4);
  await p.locator('.nav-item[data-tab="history"]').click();
  await p.waitForSelector("[data-baseline]");
  await p.locator("[data-baseline]").first().click();
  assert.match(await p.locator("#baseline-label").textContent(), /saved run/);
  await p.click("#clear-baseline");
  const download = p.waitForEvent("download");
  await p.click('[data-export="html"]');
  const dl = await download;
  assert.match(dl.suggestedFilename(), /\.html$/);
  for (const width of [1920, 1366, 768, 390]) {
    await p.setViewportSize({ width, height: 900 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `overflow at ${width}`,
    );
  }
  await p.screenshot({
    path: new URL("mobile.png", root).pathname,
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "Browser PASS: clean, blocked, changed claim, Persian, 4 ablations, saved baseline, HTML download, 1920/1366/768/390 widths; no page errors.",
  );
} finally {
  await browser.close();
  await new Promise((r) => s.close(r));
  await rm(dir, { recursive: true, force: true });
}
