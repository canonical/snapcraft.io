export const PROMOTE_REVISION = "PROMOTE_REVISION";
export const UNDO_RELEASE = "UNDO_RELEASE";
export const CANCEL_PENDING_RELEASES = "CANCEL_PENDING_RELEASES";

export function promoteRevision(revision, channel) {
  return {
    type: PROMOTE_REVISION,
    payload: { revision, channel }
  };
}

export function undoRelease(revision, channel) {
  return {
    type: UNDO_RELEASE,
    payload: { revision, channel }
  };
}

export function cancelPendingReleases() {
  return {
    type: CANCEL_PENDING_RELEASES
  };
}
