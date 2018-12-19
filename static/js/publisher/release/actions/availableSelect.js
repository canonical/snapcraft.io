export const SET_AVAILABLE_SELECT = "SET_AVAILABLE_SELECT";

export function setAvailableSelect(value) {
  return {
    type: SET_AVAILABLE_SELECT,
    payload: { value }
  };
}
