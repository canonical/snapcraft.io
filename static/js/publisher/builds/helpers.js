const NEVER_BUILT = "never_built";
const BUILDING_SOON = "building_soon";
const WONT_RELEASE = "wont_release";
const RELEASED = "released";
const RELEASE_FAILED = "release_failed";
const RELEASING_SOON = "releasing_soon";
const IN_PROGRESS = "in_progress";
const FAILED_TO_BUILD = "failed_to_build";
const UNKNOWN = "unknown";

export const UserFacingStatus = {
  // Used only when there is no build returned from LP.
  // When build is returned from LP (scheduled) it's 'Building soon' for BSI.
  [NEVER_BUILT]: createStatus("Never built", "Never built", 8, "never_built"),
  [BUILDING_SOON]: createStatus(
    "Building soon",
    "Building",
    7,
    "building_soon"
  ),
  [WONT_RELEASE]: createStatus(
    "Built, won’t be released",
    "Built",
    6,
    "wont_release"
  ),
  [RELEASED]: createStatus("Built and released", "Released", 5, "released"),
  [RELEASE_FAILED]: createStatus(
    "Built, failed to release",
    "Failed",
    4,
    "release_failed"
  ),
  [RELEASING_SOON]: createStatus(
    "Built, releasing soon",
    "Built",
    3,
    "releasing_soon"
  ),
  [IN_PROGRESS]: createStatus("In progress", "In progress", 2, "in_progress"),
  [FAILED_TO_BUILD]: createStatus(
    "Failed to build",
    "Failed",
    1,
    "failed_to_build"
  ),
  [UNKNOWN]: createStatus("Unknown", "Unknown", 8, "never_built")
};

function createStatus(statusMessage, shortStatusMessage, priority, badge) {
  return {
    statusMessage,
    shortStatusMessage,
    icon: badge.indexOf("failed") > -1 ? "error" : false,
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
