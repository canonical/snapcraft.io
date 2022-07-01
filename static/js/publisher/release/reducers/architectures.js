import { UPDATE_ARCHITECTURES } from "../actions/architectures";

export default function architectures(state = [], action) {
  switch (action.type) {
    case UPDATE_ARCHITECTURES:
      return [...action.payload.architectures];
    default:
      return state;
  }
}
