export const UPDATE_FAILED_REVISIONS = "UPDATE_FAILED_REVISIONS";

type FailedRevisionInfo = { channel: string, architecture: string, revision: number }

export function updateFailedRevisions(failedRevisions: FailedRevisionInfo[]) {
    return {
        type: UPDATE_FAILED_REVISIONS,
        payload: { failedRevisions },
    };
}
