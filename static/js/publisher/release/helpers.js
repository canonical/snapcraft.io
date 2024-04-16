import { AVAILABLE, REVISION_STATUS } from "./constants";
import { getChannelString } from "../../libs/channels";
import { useEffect } from "react";

export function isInDevmode(revision) {
  return revision.confinement === "devmode" || revision.grade === "devel";
}

export function getChannelName(track, risk, branch) {
  if (risk === AVAILABLE) {
    return AVAILABLE;
  }

  return getChannelString({
    track,
    risk,
    branch,
  });
}

export function getBuildId(revision) {
  return (
    revision && revision.attributes && revision.attributes["build-request-id"]
  );
}

export function isRevisionBuiltOnLauchpad(revision) {
  const buildId = getBuildId(revision);
  return !!(buildId && buildId.indexOf("lp-") === 0);
}

export function getRevisionsArchitectures(revisions) {
  let archs = [];

  // get all architectures from all revisions
  revisions.forEach((revision) => {
    archs = archs.concat(revision.architectures);
  });

  // make archs unique and sorted
  archs = archs.filter((item, i, ar) => ar.indexOf(item) === i).sort();

  return archs;
}

export function isSameVersion(revisions) {
  let hasSameVersion = false;
  let versionsMap = {};

  if (revisions) {
    // calculate map of architectures for each version
    for (const arch in revisions) {
      const revision = revisions[arch];
      const version = revision.version;
      if (!versionsMap[version]) {
        versionsMap[version] = [];
      }
      versionsMap[version].push(arch);
    }

    hasSameVersion = Object.keys(versionsMap).length === 1;
  }

  return hasSameVersion;
}

export function jsonClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function canBeReleased(revision) {
  const allowed = [REVISION_STATUS.PUBLISHED, REVISION_STATUS.UNPUBLISHED];

  return revision && allowed.includes(revision.status);
}

export function validatePhasingPercentage(value) {
  if (value.trim()) {
    if (isNaN(value)) {
      return "Phasing percentage must be a number";
    } else {
      const percentage = parseFloat(value);
      if (percentage < 0 || percentage > 100) {
        return "Phasing percentage must be between 0 and 100";
      }
    }
  }
  return "";
}

export function resizeAsidePanel(tracks) {
  useEffect(() => {
    function adjustAsidePanelHeight() {
      const targetComponent = document.querySelector("#main-content");
      const asidePanel =
        tracks.length > 1
          ? document.querySelector("#add-track-aside-panel")
          : document.querySelector("#request-track-aside-panel");
      if (targetComponent && asidePanel) {
        const targetRect = targetComponent.getBoundingClientRect();
        const targetTop = targetRect.top;
        const targetBottom = targetRect.bottom;
        const viewportHeight = window.innerHeight;

        if (targetBottom > viewportHeight) {
          asidePanel.style.position = "fixed";
          asidePanel.style.top = `${targetTop}px`;
          asidePanel.style.bottom = "0";
        } else {
          asidePanel.style.position = "sticky";
          asidePanel.style.top = `${targetTop}px`;
        }
      }
    }

    adjustAsidePanelHeight();

    window.addEventListener("resize", adjustAsidePanelHeight);
    window.addEventListener("scroll", adjustAsidePanelHeight);

    return () => {
      window.removeEventListener("resize", adjustAsidePanelHeight);
      window.removeEventListener("scroll", adjustAsidePanelHeight);
    };
  }, [tracks]);
}

export function numericalSort(a, b) {
  const regex = /\d+/g;
  const numSeqA = (a.match(regex) || []).map(Number);
  const numSeqB = (b.match(regex) || []).map(Number);

  for (let i = 0; i < Math.max(numSeqA.length, numSeqB.length); i++) {
    const numA = numSeqA[i] || 0;
    const numB = numSeqB[i] || 0;

    if (numA !== numB) {
      return numA - numB;
    }
  }

  return a.localeCompare(b);
}
