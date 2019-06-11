export function isInDevmode(revision) {
  return revision.confinement === "devmode" || revision.grade === "devel";
}
