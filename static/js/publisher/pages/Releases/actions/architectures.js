export const UPDATE_ARCHITECTURES = "UPDATE_ARCHITECTURES";

export function updateArchitectures(revisions) {
  let archs = [];

  revisions.forEach((revision) => {
    archs = archs.concat(revision.architectures);
  });

  // make archs unique and sorted
  archs = archs.filter((item, i, ar) => ar.indexOf(item) === i);

  return {
    type: UPDATE_ARCHITECTURES,
    payload: {
      architectures: archs,
    },
  };
}
