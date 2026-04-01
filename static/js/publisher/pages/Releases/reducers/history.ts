import type {
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import type { RootAction } from "../actions";
import {
  OPEN_HISTORY,
  CLOSE_HISTORY,
} from "../actions/history";
import { CLOSE_CHANNEL } from "../actions/pendingChanges";

export default function history(
  state: ReleasesReduxState["history"] = {
    filters: null,
    isOpen: false,
  },
  action: RootAction
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
