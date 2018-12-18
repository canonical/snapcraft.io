import { OPEN_HISTORY, CLOSE_HISTORY } from "../actions/history";
import { RELEASE_REVISION } from "../actions/pendingReleases";
import { CLOSE_CHANNEL } from "../actions/pendingCloses";

export default function history(
  state = {
    filters: null,
    isOpen: false
  },
  action
) {
  switch (action.type) {
    case OPEN_HISTORY:
      return {
        ...state,
        isOpen: true,
        ...action.payload
      };
    case CLOSE_HISTORY:
    case RELEASE_REVISION:
    case CLOSE_CHANNEL:
      return {
        ...state,
        isOpen: false,
        filters: null
      };
    default:
      return state;
  }
}
