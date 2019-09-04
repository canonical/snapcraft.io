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

export function isRevisionBuiltOnLauchpad(revision) {
  return (
    revision.attributes &&
    revision.attributes["build-request-id"] &&
    revision.attributes["build-request-id"].indexOf("lp-") === 0
  );
}
