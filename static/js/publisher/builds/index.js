import React from "react";
import ReactDOM from "react-dom";

import distanceInWords from "date-fns/distance_in_words_strict";

import MainTable from "@canonical/react-components/dist/components/MainTable";

const NEVER_BUILT = "never_built";
const BUILDING_SOON = "building_soon";
const WONT_RELEASE = "wont_release";
const RELEASED = "released";
const RELEASE_FAILED = "release_failed";
const RELEASING_SOON = "releasing_soon";
const IN_PROGRESS = "in_progress";
const FAILED_TO_BUILD = "failed_to_build";
const UNKNOWN = "unknown";

// based on BSI:
// https://github.com/canonical-web-and-design/build.snapcraft.io/blob/master/src/common/helpers/snap-builds.js
export const BuildStatusColours = {
  BLUE: "blue",
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
  GREY: "grey"
};

export const BuildStatusIcons = {
  TICK: "tick",
  TICK_OUTLINED: "outlined_tick",
  TICK_SOLID: "solid_tick",
  ELLIPSES: "ellipses",
  SPINNER: "spinner",
  CROSS: "cross"
};

export const UserFacingStatus = {
  // Used only when there is no build returned from LP.
  // When build is returned from LP (scheduled) it's 'Building soon' for BSI.
  [NEVER_BUILT]: createStatus(
    "Never built",
    BuildStatusColours.GREY,
    false,
    8,
    "never_built"
  ),
  [BUILDING_SOON]: createStatus(
    "Building soon",
    BuildStatusColours.GREY,
    BuildStatusIcons.ELLIPSES,
    7,
    "building_soon"
  ),
  [WONT_RELEASE]: createStatus(
    "Built, won’t be released",
    BuildStatusColours.GREEN,
    BuildStatusIcons.TICK_OUTLINED,
    6,
    "wont_release"
  ),
  [RELEASED]: createStatus(
    "Built and released",
    BuildStatusColours.GREEN,
    BuildStatusIcons.TICK_SOLID,
    5,
    "released"
  ),
  [RELEASE_FAILED]: createStatus(
    "Built, failed to release",
    BuildStatusColours.RED,
    BuildStatusIcons.TICK,
    4,
    "release_failed"
  ),
  [RELEASING_SOON]: createStatus(
    "Built, releasing soon",
    BuildStatusColours.GREY,
    BuildStatusIcons.TICK,
    3,
    "releasing_soon"
  ),
  [IN_PROGRESS]: createStatus(
    "In progress",
    BuildStatusColours.BLUE,
    BuildStatusIcons.SPINNER,
    2,
    "in_progress"
  ),
  [FAILED_TO_BUILD]: createStatus(
    "Failed to build",
    BuildStatusColours.RED,
    BuildStatusIcons.CROSS,
    1,
    "failed_to_build"
  ),
  [UNKNOWN]: createStatus(
    "Unknown",
    BuildStatusColours.GREY,
    false,
    8,
    "never_built"
  )
};

function createStatus(statusMessage, colour, icon, priority, badge) {
  return {
    statusMessage,
    colour,
    icon,
    priority,
    badge
  };
}

function createDuration(duration) {
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

export function initBuilds(id, snapName, builds) {
  const rows = builds.map(build => {
    return {
      columns: [
        {
          content: <a href={build.link}>#{build.id}</a>
        },
        {
          content: build.arch_tag
        },
        {
          content: createDuration(build.duration),
          className: "u-hide--small"
        },
        {
          content: (
            <span
              className={`u-build-status--${
                UserFacingStatus[build.status].colour
              }`}
            >
              {UserFacingStatus[build.status].statusMessage}
            </span>
          )
        },
        {
          content: distanceInWords(new Date(), build.datebuilt, {
            addSuffix: true
          }),
          className: "u-align--right"
        }
      ]
    };
  });

  ReactDOM.render(
    <MainTable
      headers={[
        {
          content: "ID"
        },
        {
          content: "Architecture"
        },
        {
          content: "Duration",
          className: "u-hide--small"
        },
        {
          content: "Result"
        },
        {
          content: "",
          className: "u-align--right"
        }
      ]}
      rows={rows}
    />,
    document.querySelector(id)
  );
}
