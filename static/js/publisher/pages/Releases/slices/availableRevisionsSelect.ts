import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
  AVAILABLE_REVISIONS_SELECT_ALL,
} from "../constants";
import { selectRevision, clearSelectedRevisions } from "./channelMap";
import {
  getArchitectures,
  getFilteredAvailableRevisions,
  getFilteredAvailableRevisionsForArch,
} from "../selectors";
import { getBuildId } from "../helpers";
import type {
  AvailableRevisionsSelect,
  AvailableRevisionsSelectState,
  Revision
} from "../../../types/releaseTypes";
import type { AppDispatch, RootState } from "../store";

const availableRevisionsSelectSlice = createSlice({
  name: "availableRevisionsSelect",
  initialState: AVAILABLE_REVISIONS_SELECT_UNRELEASED as AvailableRevisionsSelectState,
  reducers: {
    setAvailableRevisionsSelect(_state, action: PayloadAction<AvailableRevisionsSelectState>) {
      return action.payload;
    },
  },
});

export const { setAvailableRevisionsSelect } = availableRevisionsSelectSlice.actions;
export default availableRevisionsSelectSlice.reducer;

export function selectAvailableRevisions(value: AvailableRevisionsSelect) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(setAvailableRevisionsSelect(value));
    dispatch(clearSelectedRevisions());

    const state = getState();

    // for each architecture
    const archs = getArchitectures(state);
    let revisionsFilter: (revision: Revision) => boolean = () => true;

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
        revisionsFilter = (revision) => revision.version === recentVersion;
      }
    }

    if (value === AVAILABLE_REVISIONS_SELECT_LAUNCHPAD) {
      const lpRevisions = getFilteredAvailableRevisions(state);

      if (lpRevisions.length > 0) {
        const recentBuild = getBuildId(lpRevisions[0]);

        revisionsFilter = (revision) => getBuildId(revision) === recentBuild;
      }
    }

    // get latest revision to select
    archs.forEach((arch) => {
      const revisions = getFilteredAvailableRevisionsForArch(state, arch);

      const revisionToSelect = revisions.filter(revisionsFilter)[0];
      if (revisionToSelect) {
        dispatch(selectRevision(revisionToSelect));
      }
    });
  };
}
