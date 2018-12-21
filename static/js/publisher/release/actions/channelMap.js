export const INIT_CHANNEL_MAP = "INIT_CHANNEL_MAP";
export const SELECT_REVISION = "SELECT_REVISION";
export const CLEAR_SELECTED_REVISIONS = "CLEAR_SELECTED_REVISIONS";
export const RELEASE_REVISION_SUCCESS = "RELEASE_REVISION_SUCCESS";
export const CLOSE_CHANNEL_SUCCESS = "CLOSE_CHANNEL_SUCCESS";

export function initChannelMap(channelMap) {
  return {
    type: INIT_CHANNEL_MAP,
    payload: { channelMap }
  };
}

export function selectRevision(revision) {
  return {
    type: SELECT_REVISION,
    payload: { revision, toggle: false }
  };
}

export function toggleRevision(revision) {
  return {
    type: SELECT_REVISION,
    payload: { revision, toggle: true }
  };
}

export function clearSelectedRevisions() {
  return {
    type: CLEAR_SELECTED_REVISIONS
  };
}

export function releaseRevisionSuccess(revision, channel) {
  return {
    type: RELEASE_REVISION_SUCCESS,
    payload: {
      revision,
      channel
    }
  };
}

export function closeChannelSuccess(channel) {
  return {
    type: CLOSE_CHANNEL_SUCCESS,
    payload: {
      channel
    }
  };
}
