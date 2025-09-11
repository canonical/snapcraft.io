import { coverageConfigDefaults, defineConfig } from "vitest/config";
import { jsxInJsPlugin } from "./vite.config";

export default defineConfig({
  css: false,
  plugins: [jsxInJsPlugin()],
  test: {
    dir: "static/js",
    globals: true,
    environment: "happy-dom",
    silent: "passed-only",
    pool: "threads",
    coverage: {
      enabled: true,
      provider: "v8",
      all: false, // don't include untested files, in Vitest 4.0 option is removed but will be default behavior
      reporter: ["cobertura", "html"],
      reportsDirectory: "coverage/vitest",
      include: ["static/js/**"],
      exclude: [
        "static/js/**.d.ts",
        "static/js/config/**",
        "static/js/dist/**",
        "static/js/modules/**",
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
