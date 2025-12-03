import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { OPEN_HISTORY, CLOSE_HISTORY } from "../actions/history";
import { CLOSE_CHANNEL } from "../actions/pendingCloses";

export type OpenHistoryAction = GenericReleasesAction<
  typeof OPEN_HISTORY,
  Partial<ReleasesReduxState["history"]>
>;

export type CloseHistoryAction = GenericReleasesAction<typeof CLOSE_HISTORY, never>;

export type CloseChannelAction = GenericReleasesAction<typeof CLOSE_CHANNEL, never>;

export type HistoryAction =
  | OpenHistoryAction
  | CloseHistoryAction
  | CloseChannelAction;

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
