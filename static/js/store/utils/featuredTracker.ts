import { trackEvent } from "@canonical/analytics-events";

export function trackFeaturedSnapClicked(
  snapName: string,
  position: number,
  source: "home" | "store",
): void {
  trackEvent("snap_featured_snap_clicked", {
    snap_name: snapName,
    position,
    source,
  });
}
