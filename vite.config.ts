import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        demo: resolve(__dirname, "index.html"),
        examples: resolve(__dirname, "examples.html"),
        docs: resolve(__dirname, "docs.html"),
        gettingStarted: resolve(__dirname, "docs/getting-started.html"),
        seriesAndPanes: resolve(__dirname, "docs/series-and-panes.html"),
        axesAndInteractions: resolve(
          __dirname,
          "docs/axes-and-interactions.html",
        ),
        benchmarks: resolve(__dirname, "benchmarks.html"),
      },
    },
  },
});
