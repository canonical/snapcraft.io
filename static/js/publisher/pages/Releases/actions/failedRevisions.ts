export const UPDATE_FAILED_REVISIONS = "UPDATE_FAILED_REVISIONS";

export function updateFailedRevisions(failedRevisions: Array<{ channel: string, architecture: string, revision: number }>) {
    return {
        type: UPDATE_FAILED_REVISIONS,
        payload: { failedRevisions },
    };
}
