export const UPDATE_FAILED_REVISIONS = "UPDATE_FAILED_REVISIONS";

export function updateFailedRevisions(failedRevisions: { channel: string, architecture: string }) {
    return {
        type: UPDATE_FAILED_REVISIONS,
        payload: { failedRevisions },
    };
}
