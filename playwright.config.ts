import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:8011",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "ENVIRONMENT=production FLASK_DEBUG=0 PYTHONPATH=. " +
      "gunicorn --config tests/e2e/publisher_server.py",
    url: "http://127.0.0.1:8011/publisher/jetbrains",
    timeout: 120_000,
    // Reuse a locally running server to survive interrupted runs; in CI
    // always start a fresh one so a stale server can't mask failures.
    reuseExistingServer: !process.env.CI,
  },
});
