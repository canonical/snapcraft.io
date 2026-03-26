import { initFSFLanguageSelect } from "./fsf-language-select";
import nps from "./nps";
import initExpandableArea from "./expandable-area";
import declareGlobal from "../libs/declare";
import { trackEvent, trackPageView } from "@canonical/analytics-events";

if (window.ANALYTICS_ENDPOINT) {
  console.log("[analytics] trackPageView: snap_home_page");
  trackPageView("snap_home_page");
}

function initHomeSearchTracking(): void {
  const form = document.querySelector(
    "[data-js='home-search-form']",
  ) as HTMLFormElement | null;

  if (form) {
    form.addEventListener("submit", () => {
      const input = form.querySelector("input[name='q']") as HTMLInputElement;
      if (input?.value) {
        const searchId = crypto.randomUUID();
        sessionStorage.setItem("search_id", searchId);

        console.log("[analytics] snap_home_search_submitted", {
          search_id: searchId,
          query: input.value,
        });
        trackEvent("snap_home_search_submitted", {
          search_id: searchId,
          query: input.value,
        });
      }
    });
  }
}

declareGlobal("snapcraft.public.homepage", {
  initExpandableArea,
  initFSFLanguageSelect,
  initHomeSearchTracking,
  nps,
});
