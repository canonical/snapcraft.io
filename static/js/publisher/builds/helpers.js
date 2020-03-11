const NEVER_BUILT = "never_built";
const BUILDING_SOON = "building_soon";
const WONT_RELEASE = "wont_release";
const RELEASED = "released";
const RELEASE_FAILED = "release_failed";
const RELEASING_SOON = "releasing_soon";
const IN_PROGRESS = "in_progress";
const FAILED_TO_BUILD = "failed_to_build";
const CANCELLED = "cancelled";
const UNKNOWN = "unknown";

export const UserFacingStatus = {
  // Used only when there is no build returned from LP.
  // When build is returned from LP (scheduled) it's 'Building soon' for BSI.
  [NEVER_BUILT]: createStatus("Never built", "Never built", 8, NEVER_BUILT),
  [BUILDING_SOON]: createStatus("Building soon", "Building", 7, BUILDING_SOON),
  [WONT_RELEASE]: createStatus(
    "Built, won’t be released",
    "Built",
    6,
    WONT_RELEASE
  ),
  [RELEASED]: createStatus("Built and released", "Released", 5, "released"),
  [RELEASE_FAILED]: createStatus(
    "Built, failed to release",
    "Failed",
    4,
    RELEASE_FAILED
  ),
  [RELEASING_SOON]: createStatus(
    "Built, releasing soon",
    "Releasing",
    3,
    RELEASING_SOON
  ),
  [IN_PROGRESS]: createStatus("In progress", "In progress", 2, IN_PROGRESS),
  [FAILED_TO_BUILD]: createStatus(
    "Failed to build",
    "Failed",
    1,
    FAILED_TO_BUILD
  ),
  [CANCELLED]: createStatus("Cancelled", "Cancelled", 8, FAILED_TO_BUILD),
  [UNKNOWN]: createStatus("Unknown", "Unknown", 8, NEVER_BUILT)
};

function createStatus(statusMessage, shortStatusMessage, priority, badge) {
  const loadingStatus = [IN_PROGRESS, RELEASING_SOON];
  let icon;
  if (badge.indexOf("failed") > -1) {
    icon = "error";
  } else if (loadingStatus.indexOf(badge) > -1) {
    icon = "spinner u-animation--spin";
  }

  return {
    statusMessage,
    shortStatusMessage,
    icon: icon,
    priority,
    badge
  };
}

export function createDuration(duration) {
  if (duration) {
    const durationParts = duration.split(":");
    const hours = parseInt(durationParts[0]);
    const minutes = parseInt(durationParts[1]);
    const seconds = Math.round(parseInt(durationParts[2]));

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }

    return `${seconds} second${seconds > 1 || seconds === 0 ? "s" : ""}`;
  }
  return "";
}
