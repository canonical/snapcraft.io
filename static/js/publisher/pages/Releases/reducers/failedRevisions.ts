import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { UPDATE_FAILED_REVISIONS } from "../actions/failedRevisions";

export type UpdateFailedRevisionsAction = GenericReleasesAction<
  typeof UPDATE_FAILED_REVISIONS,
  { failedRevisions: ReleasesReduxState["failedRevisions"] }
>;

export type FailedRevisionsAction = UpdateFailedRevisionsAction;

export default function failedRevisions(
  state: ReleasesReduxState["failedRevisions"] = [],
  action: FailedRevisionsAction
) {
  switch (action.type) {
    case UPDATE_FAILED_REVISIONS:
      return [...state, ...action.payload.failedRevisions];
    default:
      return state;
  }
}
