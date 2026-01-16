import { FailedRevision, GenericReleasesAction, ReleasesReduxState } from "../../../types/releaseTypes";

export const UPDATE_FAILED_REVISIONS = "UPDATE_FAILED_REVISIONS";

export type UpdateFailedRevisionsAction = GenericReleasesAction<
  typeof UPDATE_FAILED_REVISIONS,
  { failedRevisions: ReleasesReduxState["failedRevisions"] }
>;

export type FailedRevisionsAction = UpdateFailedRevisionsAction;

export function updateFailedRevisions(failedRevisions: FailedRevision[]) {
  return {
    type: UPDATE_FAILED_REVISIONS,
    payload: { failedRevisions },
  };
}
