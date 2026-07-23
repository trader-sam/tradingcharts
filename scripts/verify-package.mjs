import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { chromium } from "playwright";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (args, cwd) =>
  execFileSync(npm, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
    shell: process.platform === "win32",
  });

const root = process.cwd();
const workspace = mkdtempSync(join(tmpdir(), "tradingcharts-package-"));
const contentType = (path) =>
  ({ ".html": "text/html", ".js": "text/javascript" })[extname(path)] ??
  "application/octet-stream";

async function verifyBrowserConsumer(consumer) {
  const rootPath = resolve(consumer);
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    const target = resolve(rootPath, pathname === "/" ? "index.html" : `.${pathname}`);
    const pathFromRoot = relative(rootPath, target);
    if (pathFromRoot.startsWith("..") || isAbsolute(pathFromRoot)) {
      response.writeHead(403).end();
      return;
    }
    try {
      response.writeHead(200, { "content-type": contentType(target) }).end(readFileSync(target));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to start packed-consumer server.");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForSelector(".tradingchart-canvas");
    if (errors.length) throw new Error(`Packed browser consumer failed: ${errors.join("\n")}`);
    await page.evaluate(() => window.chart.destroy());
    if (await page.locator(".tradingchart-canvas").count())
      throw new Error("Packed browser consumer did not destroy its chart.");
  } finally {
    await browser.close();
    await new Promise((closed) => server.close(closed));
  }
}

try {
  // Build explicitly, then suppress lifecycle output from `npm pack --json`.
  // This keeps the machine-readable pack manifest stable even with `prepack`.
  run(["run", "build"], root);
  const packed = JSON.parse(run(["pack", "--ignore-scripts", "--json", "--pack-destination", workspace], root));
  const tarball = join(workspace, packed[0].filename);
  const consumer = join(workspace, "consumer");
  mkdirSync(consumer);
  writeFileSync(join(workspace, "package.json"), JSON.stringify({ private: true, type: "module" }));
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module", dependencies: { tradingcharts: `file:${tarball}` } }),
  );
  writeFileSync(
    join(consumer, "index.mjs"),
    `import { createChart, createDepthData, zeroAnchoredTicks } from "tradingcharts";
if (typeof createChart !== "function" || typeof createDepthData !== "function") throw new Error("TradingCharts exports are unavailable");
if (zeroAnchoredTicks(-3, 5, 3).values.length < 3) throw new Error("TradingCharts helper is unavailable");
console.log("TradingCharts packed-consumer import passed.");\n`,
  );
  writeFileSync(
    join(consumer, "index.cjs"),
    `const { createChart, createDepthData, zeroAnchoredTicks } = require("tradingcharts");
if (typeof createChart !== "function" || typeof createDepthData !== "function" || typeof zeroAnchoredTicks !== "function") throw new Error("TradingCharts CommonJS exports are unavailable");
console.log("TradingCharts packed-consumer CommonJS import passed.");\n`,
  );
  writeFileSync(
    join(consumer, "index.html"),
    `<!doctype html><meta charset="utf-8"><style>#chart { width: 720px; height: 360px; }</style>
<div id="chart"></div>
<script type="importmap">{"imports":{"tradingcharts":"/node_modules/tradingcharts/dist/tradingcharts.js"}}</script>
<script type="module">import { createChart } from "tradingcharts";
window.chart = createChart(document.querySelector("#chart"));
window.chart.setData([{time: 1, open: 10, high: 12, low: 9, close: 11}, {time: 2, open: 11, high: 13, low: 10, close: 12}]);</script>\n`,
  );
  writeFileSync(
    join(consumer, "index.ts"),
    `import { createChart, createDepthData, zeroAnchoredTicks } from "tradingcharts";
void createChart; void createDepthData; void zeroAnchoredTicks;\n`,
  );
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext", target: "ES2022", strict: true, noEmit: true } }),
  );
  run(["install", "--ignore-scripts", "--no-package-lock"], consumer);
  execFileSync(process.execPath, [join(root, "node_modules", "typescript", "bin", "tsc"), "--project", consumer], { cwd: consumer, stdio: "inherit" });
  execFileSync(process.execPath, ["index.mjs"], { cwd: consumer, stdio: "inherit" });
  execFileSync(process.execPath, ["index.cjs"], { cwd: consumer, stdio: "inherit" });
  await verifyBrowserConsumer(consumer);
  console.log("TradingCharts packed-consumer browser mount passed.");
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
