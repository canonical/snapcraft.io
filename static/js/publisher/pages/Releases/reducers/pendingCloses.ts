import { ReleasesReduxState } from "../../../types/releaseTypes";
import { CLOSE_CHANNEL, PendingClosesAction } from "../actions/pendingCloses";
import {
  CANCEL_PENDING_RELEASES,
  RELEASE_REVISION
} from "../actions/pendingReleases";

// channels to be closed:
// [ "track/risk", ... ]
export default function pendingCloses(
  state: ReleasesReduxState["pendingCloses"] = [],
  action: PendingClosesAction
) {
  switch (action.type) {
    case CLOSE_CHANNEL:
      if (state.includes(action.payload.channel)) {
        return state;
      }
      return [...state, action.payload.channel];
    case RELEASE_REVISION:
      if (!state.includes(action.payload.channel)) {
        return state;
      }
      state = [...state];
      // remove channel released to from closing channels
      state.splice(state.indexOf(action.payload.channel), 1);
      return state;
    case CANCEL_PENDING_RELEASES:
      return [];
    default:
      return state;
  }
}
