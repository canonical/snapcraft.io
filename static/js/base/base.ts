import "./ga";
import "./contactForm";
import "./sentry";
import { initAnalytics } from "@canonical/analytics-events";

declare global {
  interface Window {
    ANALYTICS_ENDPOINT: string;
  }
}

if (window.ANALYTICS_ENDPOINT) {
  initAnalytics({
    appName: "snapcraft",
    endpoint: window.ANALYTICS_ENDPOINT,
  });
}
