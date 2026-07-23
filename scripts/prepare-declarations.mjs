import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const typesDir = join(process.cwd(), "dist", "types");

for (const file of readdirSync(typesDir)) {
  if (!file.endsWith(".d.ts")) continue;
  const path = join(typesDir, file);
  const source = readFileSync(path, "utf8");
  // NodeNext consumers require explicit relative ESM specifiers. TypeScript
  // resolves the emitted .js specifier to the neighboring .d.ts file.
  const updated = source.replaceAll(/from "(\.\/[^".]+)"/g, 'from "$1.js"');
  if (updated !== source) writeFileSync(path, updated);
}
