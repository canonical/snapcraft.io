import "./contactForm";
import "./sentry";
import { initAnalytics } from "@canonical/analytics-events";

if (window.ENVIRONMENT === "production") {
  initAnalytics({
    appName: "snapcraft",
    gtm: true,
  });
}
