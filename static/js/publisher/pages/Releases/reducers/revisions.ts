import {
  UPDATE_REVISIONS,
  RevisionsAction,
} from "../actions/revisions";
import { ReleasesReduxState } from "../../../types/releaseTypes";

export default function revisions(
  state: ReleasesReduxState["revisions"] = {},
  action: RevisionsAction
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
