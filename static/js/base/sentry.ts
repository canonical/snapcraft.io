const pendingExceptions: unknown[] = [];
let sentryInitialized = false;

window.Sentry = {
  captureException: (error: unknown) => pendingExceptions.push(error),
};

const captureWindowError = (event: ErrorEvent): void => {
  pendingExceptions.push(event.error || event.message);
};

const captureUnhandledRejection = (event: PromiseRejectionEvent): void => {
  pendingExceptions.push(event.reason);
};

window.addEventListener("error", captureWindowError);
window.addEventListener("unhandledrejection", captureUnhandledRejection);

async function initSentry(): Promise<void> {
  if (sentryInitialized) {
    return;
  }

  sentryInitialized = true;
  const Sentry = await import("@sentry/browser");

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

  window.removeEventListener("error", captureWindowError);
  window.removeEventListener("unhandledrejection", captureUnhandledRejection);
  window.Sentry = Sentry;
  pendingExceptions.forEach((error) => Sentry.captureException(error));
}

function scheduleSentry(): void {
  window.setTimeout(() => void initSentry(), 15000);
}

window.addEventListener("pointerdown", () => void initSentry(), { once: true });
window.addEventListener("keydown", () => void initSentry(), { once: true });

if (document.readyState === "complete") {
  scheduleSentry();
} else {
  window.addEventListener("load", scheduleSentry, { once: true });
}
