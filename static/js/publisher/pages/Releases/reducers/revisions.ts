import {
  UPDATE_REVISIONS,
} from "../actions/revisions";
import { ReleasesReduxState } from "../../../types/releaseTypes";
import { RootAction } from "../actions";

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
