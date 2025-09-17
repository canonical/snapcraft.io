import * as Sentry from "@sentry/browser";

window.Sentry = Sentry;

Sentry.init({
  allowUrls: ["staging.snapcraft.io/static/js", "snapcraft.io/static/js/"],
  denyUrls: [
    "staging.snapcraft.io/static/js/modules",
    "snapcraft.io/static/js/modules",
  ],
  dsn: window.SENTRY_DSN,
  environment: window.ENVIRONMENT,
  ignoreErrors: ["AbortError"],
  release: window.COMMIT_ID,
});
