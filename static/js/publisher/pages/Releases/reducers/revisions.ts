import {
  UPDATE_REVISIONS,
} from "../actions/revisions";
import type { ReleasesReduxState } from "../../../types/releaseTypes";
import type { RootAction } from "../actions";

export default function revisions(
  state: ReleasesReduxState["revisions"] = {},
  action: RootAction
) {
  switch (action.type) {
    case UPDATE_REVISIONS:
      return {
        ...state,
        ...action.payload.revisions,
      };
    default:
      return state;
  }
}
