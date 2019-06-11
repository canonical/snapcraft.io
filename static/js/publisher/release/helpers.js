import { AVAILABLE } from "./constants";

export function isInDevmode(revision) {
  return revision.confinement === "devmode" || revision.grade === "devel";
}

export function getChannelName(track, risk) {
  return risk === AVAILABLE ? risk : `${track}/${risk}`;
}
