import { trackEvent } from "@canonical/analytics-events";

const SEARCH_ID_KEY = "search_id";

export function getSearchId(): string {
  let id = sessionStorage.getItem(SEARCH_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SEARCH_ID_KEY, id);
  }
  return id;
}

export function trackSearchSubmitted(
  source: "home" | "store",
  query: string,
): void {
  const searchId = crypto.randomUUID();
  sessionStorage.setItem(SEARCH_ID_KEY, searchId);

  trackEvent(
    source === "home"
      ? "snap_home_search_submitted"
      : "snap_store_search_submitted",
    { search_id: searchId, query },
  );
}

export function trackSearchResults(
  query: string,
  totalItems: number,
  page: number,
): void {
  const searchId = getSearchId();

  if (totalItems > 0) {
    trackEvent("snap_store_search_results_loaded", {
      search_id: searchId,
      query,
      total_items: totalItems,
      page,
    });
  } else {
    trackEvent("snap_store_search_no_results_v2", {
      search_id: searchId,
      query,
    });
  }
}

export function trackSearchResultClicked(
  query: string,
  position: number,
  snapName: string,
): void {
  trackEvent("snap_store_search_result_clicked", {
    search_id: getSearchId(),
    query,
    position,
    snap_name: snapName,
  });
}
