import { UPDATE_RELEASES } from "../actions/releases";

export default function revisions(state = [], action) {
  switch (action.type) {
    case UPDATE_RELEASES:
      return [...action.payload.releases];
    default:
      return state;
  }
}
