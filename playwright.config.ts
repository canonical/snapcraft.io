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
    command: "PYTHONPATH=. python3 tests/e2e/publisher_server.py",
    url: "http://127.0.0.1:8011/publisher/jetbrains",
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
