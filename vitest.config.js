import { defineConfig } from "vitest/config";

export default defineConfig({
  css: false,
  test: {
    dir: "static/js",
    globals: true,
    environment: "happy-dom",
    silent: "passed-only",
    pool: "threads",
    coverage: {
      enabled: false,
      reporter: ["cobertura", "html"],
      reportsDirectory: "./coverage/js",
    },
  },
});
