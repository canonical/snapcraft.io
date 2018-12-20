export const SET_AVAILABLE_REVISIONS_SELECT = "SET_AVAILABLE_REVISIONS_SELECT";

export function setAvailableRevisionsSelect(value) {
  return {
    type: SET_AVAILABLE_REVISIONS_SELECT,
    payload: { value }
  };
}
