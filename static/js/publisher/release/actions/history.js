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
