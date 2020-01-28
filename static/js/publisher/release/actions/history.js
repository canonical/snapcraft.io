export const OPEN_HISTORY = "OPEN_HISTORY";
export const CLOSE_HISTORY = "CLOSE_HISTORY";

import { triggerGAEvent } from "../actions/gaEventTracking";

export function openHistory(filters) {
  return {
    type: OPEN_HISTORY,
    payload: { filters }
  };
}

export function closeHistory() {
  return {
    type: CLOSE_HISTORY
  };
}

export function toggleHistory(filters) {
  return (dispatch, getState) => {
    const { history } = getState();

    dispatch(
      triggerGAEvent(
        `click-${history.isOpen ? "close" : "open"}-history`,
        `${filters.track}/${filters.risk}/${filters.branch}/${filters.arch}`
      )
    );

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
      dispatch(closeHistory());
    } else {
      dispatch(openHistory(filters));
    }
  };
}
