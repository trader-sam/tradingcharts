import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/index.ts",
      name: "TradingCharts",
      formats: ["es", "umd"],
      fileName: (format) =>
        format === "es" ? "tradingcharts.js" : "tradingcharts.cjs",
    },
  },
});
