import {
  ReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { UPDATE_FAILED_REVISIONS } from "../actions/failedRevisions";

type FailedRevisionsAction = ReleasesAction & {
  payload: { failedRevisions: ReleasesReduxState["failedRevisions"] };
};

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
