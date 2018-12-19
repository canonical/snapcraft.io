import { AVAILABLE_SELECT_UNRELEASED } from "../constants";
import { SET_AVAILABLE_SELECT } from "../actions/availableSelect";

export default function availableSelect(
  state = AVAILABLE_SELECT_UNRELEASED,
  action
) {
  switch (action.type) {
    case SET_AVAILABLE_SELECT:
      return action.payload.value;
    default:
      return state;
  }
}
