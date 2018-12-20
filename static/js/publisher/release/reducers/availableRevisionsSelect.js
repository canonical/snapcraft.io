import { AVAILABLE_REVISIONS_SELECT_UNRELEASED } from "../constants";
import { SET_AVAILABLE_REVISIONS_SELECT } from "../actions/availableRevisionsSelect";

export default function availableRevisionsSelect(
  state = AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  action
) {
  switch (action.type) {
    case SET_AVAILABLE_REVISIONS_SELECT:
      return action.payload.value;
    default:
      return state;
  }
}
