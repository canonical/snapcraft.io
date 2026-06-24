import { trackEvent } from "@canonical/analytics-events";

export function trackSearchSubmitted(source: "home" | "store"): void {
  trackEvent(
    source === "home" ? "home_search_submitted" : "store_search_submitted",
  );
}

export function trackSearchResults(totalItems: number, page: number): void {
  if (totalItems > 0) {
    trackEvent("store_search_results_loaded", {
      total_items: totalItems,
      page,
    });
  } else {
    trackEvent("store_search_no_results");
  }
}

export function trackSearchResultClicked(
  position: number,
  snapName: string,
): void {
  trackEvent("store_search_result_clicked", {
    position,
    snap_name: snapName,
  });
}
