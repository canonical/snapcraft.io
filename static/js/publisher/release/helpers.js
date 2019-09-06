import { AVAILABLE } from "./constants";

export function isInDevmode(revision) {
  return revision.confinement === "devmode" || revision.grade === "devel";
}

export function getChannelName(track, risk, branch) {
  let name = risk === AVAILABLE ? risk : `${track}/${risk}`;
  if (branch) {
    name = `${name}/${branch}`;
  }
  return name;
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
