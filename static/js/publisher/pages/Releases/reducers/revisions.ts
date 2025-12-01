import { UPDATE_REVISIONS } from "../actions/revisions";
import {
  ReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

type RevisionsAction = ReleasesAction & {
  payload: {
    revisions: ReleasesReduxState["revisions"];
  };
};

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
