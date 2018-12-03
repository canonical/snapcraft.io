export const OPEN_HISTORY = "OPEN_HISTORY";
export const CLOSE_HISTORY = "CLOSE_HISTORY";

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
      history.filters &&
      filters.track === history.filters.track &&
      filters.arch === history.filters.arch &&
      filters.risk === history.filters.risk
    ) {
      dispatch(closeHistory());
    } else {
      dispatch(openHistory(filters));
    }
  };
}
