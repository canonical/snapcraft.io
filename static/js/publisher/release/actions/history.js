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
            `${filters.track}/${filters.risk}/${filters.branch}/${filters.arch}`
          )
        );
      }
      dispatch(closeHistory());
    } else {
      if (filters) {
        dispatch(
          triggerGAEvent(
            `click-open-history`,
            `${filters.track}/${filters.risk}/${filters.branch}/${filters.arch}`
          )
        );
      }
      dispatch(openHistory(filters));
    }
  };
}
