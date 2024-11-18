import { AVAILABLE, REVISION_STATUS } from "./constants";
import { getChannelString } from "../../../libs/channels";
import { useEffect } from "react";

export function isInDevmode(revision: any) {
  return revision.confinement === "devmode" || revision.grade === "devel";
}

export function getChannelName(
  track: string,
  risk: string,
  branch?: string | undefined,
) {
  if (risk === AVAILABLE) {
    return AVAILABLE;
  }

  return getChannelString({
    track,
    risk,
    branch,
  });
}

export function getBuildId(revision: { attributes: { [x: string]: any } }) {
  return (
    revision && revision.attributes && revision.attributes["build-request-id"]
  );
}

export function isRevisionBuiltOnLauchpad(revision: any) {
  const buildId = getBuildId(revision);
  return !!(buildId && buildId.indexOf("lp-") === 0);
}

export function getRevisionsArchitectures(revisions: any[]) {
  let archs: any[] = [];

  // get all architectures from all revisions
  revisions.forEach((revision) => {
    archs = archs.concat(revision.architectures);
  });

  // make archs unique and sorted
  archs = archs.filter((item, i, ar) => ar.indexOf(item) === i).sort();

  return archs;
}

export function isSameVersion(revisions: { version: string }[]) {
  let hasSameVersion = false;
  const versionsMap: any = {};

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

export function jsonClone(obj: {
  string: string;
  number?: number;
  boolean?: boolean;
  array?: (string | number | boolean)[];
  function?: () => string;
}) {
  return JSON.parse(JSON.stringify(obj));
}

export function canBeReleased(revision: { status: string }) {
  const allowed = [REVISION_STATUS.PUBLISHED, REVISION_STATUS.UNPUBLISHED];

  return revision && allowed.includes(revision.status);
}

export function validatePhasingPercentage(value: string) {
  if (value.trim()) {
    if (isNaN(parseInt(value))) {
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

export function resizeAsidePanel(panelType: string) {
  useEffect(() => {
    const adjustAsidePanelHeight = () => {
      const targetComponent = document.querySelector("#main-content");
      let asidePanel;

      if (panelType === "add") {
        asidePanel = document.querySelector(
          "#add-track-aside-panel",
        ) as HTMLElement;
      } else {
        asidePanel = document.querySelector(
          "#request-track-aside-panel",
        ) as HTMLElement;
      }

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
    };

    adjustAsidePanelHeight();

    window.addEventListener("resize", adjustAsidePanelHeight);
    window.addEventListener("scroll", adjustAsidePanelHeight);

    return () => {
      window.removeEventListener("resize", adjustAsidePanelHeight);
      window.removeEventListener("scroll", adjustAsidePanelHeight);
    };
  });
}

export function numericalSort(a: string, b: string) {
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

export async function getPackageMetadata(snap: string) {
  const url = `/api/packages/${snap}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("There was a problem fetching the snap's metadata");
    }
    const data = await response.json();
    return data.data;
  } catch (e) {
    return { error: e };
  }
}
