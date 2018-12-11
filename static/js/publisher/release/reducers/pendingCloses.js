import { CLOSE_CHANNEL } from "../actions/pendingCloses";
import { CANCEL_PENDING_RELEASES } from "../actions/pendingReleases";

// channels to be closed:
// [ "track/risk", ... ]
export default function pendingCloses(state = [], action) {
  switch (action.type) {
    case CLOSE_CHANNEL:
      if (state.includes(action.payload.channel)) {
        return state;
      }
      return [...state, action.payload.channel];
    case CANCEL_PENDING_RELEASES:
      return [];
    default:
      return state;
  }
}
