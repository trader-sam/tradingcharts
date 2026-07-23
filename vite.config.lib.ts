import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/index.ts",
      name: "OpenCharts",
      formats: ["es", "umd"],
      fileName: (format) =>
        format === "es" ? "opencharts.js" : "opencharts.cjs",
    },
  },
});
