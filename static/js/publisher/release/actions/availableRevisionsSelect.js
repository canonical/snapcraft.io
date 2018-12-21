import { getArchsFromRevisionsMap } from "../releasesState";
import { selectRevision } from "./channelMap";
import { getSelectedAvailableRevisionsForArch } from "../selectors";

export const SET_AVAILABLE_REVISIONS_SELECT = "SET_AVAILABLE_REVISIONS_SELECT";

export function setAvailableRevisionsSelect(value) {
  return {
    type: SET_AVAILABLE_REVISIONS_SELECT,
    payload: { value }
  };
}

export function selectAvailableRevisions(value) {
  return (dispatch, getState) => {
    dispatch(setAvailableRevisionsSelect(value));

    // for each architecture
    const archs = getArchsFromRevisionsMap(getState().revisions);
    // get latest revision to select
    archs.forEach(arch => {
      const revisions = getSelectedAvailableRevisionsForArch(getState(), arch);

      const revisionToSelect = revisions[0];
      if (revisionToSelect) {
        dispatch(selectRevision(revisionToSelect));
      }
    });
  };
}
