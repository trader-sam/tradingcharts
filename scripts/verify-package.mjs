import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (args, cwd) =>
  execFileSync(npm, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
    shell: process.platform === "win32",
  });

const root = process.cwd();
const workspace = mkdtempSync(join(tmpdir(), "opencharts-package-"));

try {
  // Build explicitly, then suppress lifecycle output from `npm pack --json`.
  // This keeps the machine-readable pack manifest stable even with `prepack`.
  run(["run", "build"], root);
  const packed = JSON.parse(run(["pack", "--ignore-scripts", "--json", "--pack-destination", workspace], root));
  const tarball = join(workspace, packed[0].filename);
  const consumer = join(workspace, "consumer");
  mkdirSync(consumer);
  writeFileSync(
    join(workspace, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module", dependencies: { opencharts: `file:${tarball}` } }),
  );
  writeFileSync(
    join(consumer, "index.mjs"),
    `import { createChart, createDepthData, zeroAnchoredTicks } from "opencharts";
if (typeof createChart !== "function" || typeof createDepthData !== "function") throw new Error("OpenCharts exports are unavailable");
if (zeroAnchoredTicks(-3, 5, 3).values.length < 3) throw new Error("OpenCharts helper is unavailable");
console.log("OpenCharts packed-consumer import passed.");\n`,
  );
  writeFileSync(
    join(consumer, "index.ts"),
    `import { createChart, createDepthData, zeroAnchoredTicks } from "opencharts";
void createChart; void createDepthData; void zeroAnchoredTicks;\n`,
  );
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        target: "ES2022",
        strict: true,
        noEmit: true,
      },
    }),
  );
  run(["install", "--ignore-scripts", "--no-package-lock"], consumer);
  execFileSync(process.execPath, [
    join(root, "node_modules", "typescript", "bin", "tsc"),
    "--project",
    consumer,
  ], { cwd: consumer, stdio: "inherit" });
  execFileSync("node", ["index.mjs"], { cwd: consumer, stdio: "inherit" });
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
