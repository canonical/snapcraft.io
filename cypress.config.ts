import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    supportFile: false,
    blockHosts: [
      "www.googletagmanager.com",
      "analytics.google.com",
      "*.analytics.google.com",
      "www.google-analytics.com",
      "assets.ubuntu.com"
    ],
  },
});
