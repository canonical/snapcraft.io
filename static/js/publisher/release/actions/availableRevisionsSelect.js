import { AVAILABLE_REVISIONS_SELECT_RECENT } from "../constants";
import { selectRevision, clearSelectedRevisions } from "./channelMap";
import {
  getArchitectures,
  getSelectedAvailableRevisions,
  getSelectedAvailableRevisionsForArch
} from "../selectors";

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
    dispatch(clearSelectedRevisions());

    const state = getState();

    // for each architecture
    const archs = getArchitectures(state);
    let revisionsFilter = () => true;

    // for Recent select only revisions from most recent uploaded version
    if (value === AVAILABLE_REVISIONS_SELECT_RECENT) {
      const recentRevisions = getSelectedAvailableRevisions(state);

      if (recentRevisions.length > 0) {
        // find most recent version
        const recentVersion = recentRevisions[0].version;
        // filter most recent revision with given version
        revisionsFilter = revision => revision.version === recentVersion;
      }
    }

    // get latest revision to select
    archs.forEach(arch => {
      const revisions = getSelectedAvailableRevisionsForArch(state, arch);

      const revisionToSelect = revisions.filter(revisionsFilter)[0];
      if (revisionToSelect) {
        dispatch(selectRevision(revisionToSelect));
      }
    });
  };
}
