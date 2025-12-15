import {
  GenericReleasesAction,
  ReleasesReduxState,
  DispatchFn,
} from "../../../types/releaseTypes";

export const OPEN_HISTORY = "OPEN_HISTORY";
export const CLOSE_HISTORY = "CLOSE_HISTORY";

import { triggerGAEvent } from "../actions/gaEventTracking";
import { CloseChannelAction } from "./pendingCloses";

export type OpenHistoryAction = GenericReleasesAction<
  typeof OPEN_HISTORY,
  Partial<ReleasesReduxState["history"]>
>;

export type CloseHistoryAction = GenericReleasesAction<typeof CLOSE_HISTORY, never>;

export type HistoryAction = OpenHistoryAction | CloseHistoryAction | CloseChannelAction;

export function openHistory(
  filters: ReleasesReduxState["history"]["filters"]
): OpenHistoryAction {
  return {
    type: OPEN_HISTORY,
    payload: { filters },
  };
}

export function closeHistory(): CloseHistoryAction {
  return {
    type: CLOSE_HISTORY,
  };
}

export function toggleHistory(
  filters: ReleasesReduxState["history"]["filters"]
) {
  return (dispatch: DispatchFn, getState: () => ReleasesReduxState) => {
    const { history } = getState();

    if (
      history.isOpen &&
      (history.filters == filters ||
        (history.filters &&
          filters &&
          filters.track === history.filters.track &&
          filters.arch === history.filters.arch &&
          filters.risk === history.filters.risk &&
          filters.branch === history.filters.branch))
    ) {
      if (filters) {
        dispatch(
          triggerGAEvent(
            `click-close-history`,
            `${filters.track}/${filters.risk}/${filters.branch}/${filters.arch}`,
          ),
        );
      }
      dispatch(closeHistory() as any);
    } else {
      if (filters) {
        dispatch(
          triggerGAEvent(
            `click-open-history`,
            `${filters.track}/${filters.risk}/${filters.branch}/${filters.arch}`,
          ),
        );
      }
      dispatch(openHistory(filters));
    }
  };
}
