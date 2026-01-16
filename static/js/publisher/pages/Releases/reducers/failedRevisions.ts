import {
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { FailedRevisionsAction, UPDATE_FAILED_REVISIONS } from "../actions/failedRevisions";


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
