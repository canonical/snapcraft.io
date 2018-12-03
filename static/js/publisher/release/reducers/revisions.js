import { UPDATE_REVISIONS } from "../actions/revisions";

export default function revisions(state = {}, action) {
  switch (action.type) {
    case UPDATE_REVISIONS:
      return {
        ...state,
        ...action.payload.revisions
      };
    default:
      return state;
  }
}
