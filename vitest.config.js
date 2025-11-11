import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  css: false,
  plugins: [],
  test: {
    dir: "static/js", // base directory for tests
    globals: true, // inject global `vi` object in tests so we don't have to import it
    environment: "jsdom",
    silent: "passed-only", // silence logs for passed tests
    pool: "threads",
    testTimeout: 20000,
    coverage: {
      enabled: true,
      provider: "v8",
      all: false, // don't include untested files, in Vitest 4.0 option is removed but will be default behavior
      experimentalAstAwareRemapping: true, // this will be the default in Vitest 4.0
      reporter: ["cobertura", "html"],
      reportsDirectory: "coverage/js",
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
