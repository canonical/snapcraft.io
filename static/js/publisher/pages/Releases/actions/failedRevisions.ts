import { FailedRevision } from "../../../types/releaseTypes";

export const UPDATE_FAILED_REVISIONS = "UPDATE_FAILED_REVISIONS";

export function updateFailedRevisions(failedRevisions: FailedRevision[]) {
  return {
    type: UPDATE_FAILED_REVISIONS,
    payload: { failedRevisions },
  };
}
