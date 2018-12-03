export const UPDATE_RELEASES = "UPDATE_RELEASES";

export function updateReleases(releases) {
  return {
    type: UPDATE_RELEASES,
    payload: { releases }
  };
}
