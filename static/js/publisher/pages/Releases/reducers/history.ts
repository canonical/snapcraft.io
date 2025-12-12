import {
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import {
  OPEN_HISTORY,
  CLOSE_HISTORY,
  HistoryAction,
} from "../actions/history";
import { CLOSE_CHANNEL } from "../actions/pendingCloses";

export default function history(
  state: ReleasesReduxState["history"] = {
    filters: null,
    isOpen: false,
  },
  action: HistoryAction
) {
  switch (action.type) {
    case OPEN_HISTORY:
      return {
        ...state,
        isOpen: true,
        ...action.payload,
      };
    case CLOSE_HISTORY:
    case CLOSE_CHANNEL:
      return {
        ...state,
        isOpen: false,
        filters: null,
      };
    default:
      return state;
  }
}
