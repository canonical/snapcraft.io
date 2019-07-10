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
