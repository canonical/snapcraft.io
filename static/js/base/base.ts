import "./contactForm";
import "./sentry";

async function initAnalytics(): Promise<void> {
  if (window.ENVIRONMENT !== "production") {
    return;
  }

  const { initAnalytics } = await import("@canonical/analytics-events");

  initAnalytics({
    appName: "snapcraft",
    gtm: true,
  });
}

if (document.readyState === "complete") {
  void initAnalytics();
} else {
  window.addEventListener("load", () => void initAnalytics(), { once: true });
}
