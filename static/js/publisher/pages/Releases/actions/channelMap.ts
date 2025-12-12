import {
  GenericReleasesAction,
  ReleasesReduxState,
  Revision,
} from "../../../types/releaseTypes";

export const INIT_CHANNEL_MAP = "INIT_CHANNEL_MAP";
export const SELECT_REVISION = "SELECT_REVISION";
export const CLEAR_SELECTED_REVISIONS = "CLEAR_SELECTED_REVISIONS";
export const RELEASE_REVISION_SUCCESS = "RELEASE_REVISION_SUCCESS";
export const CLOSE_CHANNEL_SUCCESS = "CLOSE_CHANNEL_SUCCESS";

export type InitChannelMapAction = GenericReleasesAction<
  typeof INIT_CHANNEL_MAP,
  { channelMap: ReleasesReduxState["channelMap"] }
>;

export type SelectRevisionAction = GenericReleasesAction<
  typeof SELECT_REVISION,
  {
    revision: Revision;
    toggle: boolean;
  }
>;

export type ClearSelectedRevisionAction = GenericReleasesAction<
  typeof CLEAR_SELECTED_REVISIONS,
  never
>;

export type ReleaseRevisionSuccessAction = GenericReleasesAction<
  typeof RELEASE_REVISION_SUCCESS,
  {
    revision: Revision;
    channel: string;
  }
>;

export type CloseChannelSuccessAction = GenericReleasesAction<
  typeof CLOSE_CHANNEL_SUCCESS,
  {
    channel: string;
  }
>;

export type ChannelMapAction =
  | InitChannelMapAction
  | SelectRevisionAction
  | ClearSelectedRevisionAction
  | ReleaseRevisionSuccessAction
  | CloseChannelSuccessAction;

export function initChannelMap(
  channelMap: ReleasesReduxState["channelMap"]
): InitChannelMapAction {
  return {
    type: INIT_CHANNEL_MAP,
    payload: { channelMap },
  };
}

export function selectRevision(revision: Revision): SelectRevisionAction {
  return {
    type: SELECT_REVISION,
    payload: { revision, toggle: false },
  };
}

export function toggleRevision(revision: Revision): SelectRevisionAction {
  return {
    type: SELECT_REVISION,
    payload: { revision, toggle: true },
  };
}

export function clearSelectedRevisions(): ClearSelectedRevisionAction {
  return {
    type: CLEAR_SELECTED_REVISIONS,
  };
}

export function releaseRevisionSuccess(
  revision: Revision,
  channel: string
): ReleaseRevisionSuccessAction {
  return {
    type: RELEASE_REVISION_SUCCESS,
    payload: {
      revision,
      channel,
    },
  };
}

/**
 * 
 * @param channel Channel to close
 * @returns Action to close channel
 */
export function closeChannelSuccess(channel: string): CloseChannelSuccessAction {
  return {
    type: CLOSE_CHANNEL_SUCCESS,
    payload: {
      channel,
    },
  };
}
