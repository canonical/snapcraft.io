import { trackEvent } from "@canonical/analytics-events";

const SEARCH_ID_KEY = "search_id";

let activeSearchId = "";

function generateSearchId(): string {
  const id = crypto.randomUUID();
  sessionStorage.setItem(SEARCH_ID_KEY, id);
  activeSearchId = id;
  return id;
}

function getSearchId(): string {
  return activeSearchId || sessionStorage.getItem(SEARCH_ID_KEY) || "";
}

export function trackSearchSubmitted(
  source: "home" | "store",
  query: string,
): void {
  const searchId = generateSearchId();
  const target =
    source === "home"
      ? "snap_home_search_submitted"
      : "snap_store_search_submitted";

  trackEvent(target, { search_id: searchId, query });
}

export function trackSearchResultsLoaded(
  query: string,
  totalItems: number,
  page: number,
): void {
  const searchId = getSearchId();
  if (!searchId) return;

  trackEvent("snap_store_search_results_loaded", {
    search_id: searchId,
    query,
    total_items: totalItems,
    page,
  });
}

export function trackSearchNoResults(query: string): void {
  const searchId = getSearchId();
  if (!searchId) return;

  trackEvent("snap_store_search_no_results_v2", {
    search_id: searchId,
    query,
  });
}

export function trackSearchResultClicked(
  query: string,
  position: number,
): void {
  const searchId = getSearchId();
  if (!searchId) return;

  trackEvent("snap_store_search_result_clicked", {
    search_id: searchId,
    query,
    position,
  });
}
