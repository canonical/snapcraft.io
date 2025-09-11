import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    silent: "passed-only",
    coverage: {
      enabled: false,
      reporter: ["cobertura", "html"],
      reportsDirectory: "./coverage/js",
    },
  },
});
