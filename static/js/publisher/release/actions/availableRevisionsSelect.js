import {
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
  AVAILABLE_REVISIONS_SELECT_ALL
} from "../constants";
import { selectRevision, clearSelectedRevisions } from "./channelMap";
import {
  getArchitectures,
  getFilteredAvailableRevisions,
  getFilteredAvailableRevisionsForArch
} from "../selectors";
import { getBuildId } from "../helpers";

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
    if (
      value === AVAILABLE_REVISIONS_SELECT_RECENT ||
      value === AVAILABLE_REVISIONS_SELECT_ALL
    ) {
      const recentRevisions = getFilteredAvailableRevisions(state);

      if (recentRevisions.length > 0) {
        // find most recent version
        const recentVersion = recentRevisions[0].version;
        // filter most recent revision with given version
        revisionsFilter = revision => revision.version === recentVersion;
      }
    }

    if (value === AVAILABLE_REVISIONS_SELECT_LAUNCHPAD) {
      const lpRevisions = getFilteredAvailableRevisions(state);

      if (lpRevisions.length > 0) {
        const recentBuild = getBuildId(lpRevisions[0]);

        revisionsFilter = revision => getBuildId(revision) === recentBuild;
      }
    }

    // get latest revision to select
    archs.forEach(arch => {
      const revisions = getFilteredAvailableRevisionsForArch(state, arch);

      const revisionToSelect = revisions.filter(revisionsFilter)[0];
      if (revisionToSelect) {
        dispatch(selectRevision(revisionToSelect));
      }
    });
  };
}
