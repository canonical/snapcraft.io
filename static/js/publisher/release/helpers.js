import { AVAILABLE } from "./constants";
import { getChannelString } from "../../libs/channels";

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
    branch
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
  revisions.forEach(revision => {
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
