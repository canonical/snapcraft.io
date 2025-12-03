import { UPDATE_REVISIONS } from "../actions/revisions";
import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

export type UpdateRevisionsAction = GenericReleasesAction<
  typeof UPDATE_REVISIONS,
  {
    revisions: ReleasesReduxState["revisions"];
  }
>;

export type RevisionsAction = UpdateRevisionsAction;

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
