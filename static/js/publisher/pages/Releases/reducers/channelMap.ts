import { AVAILABLE } from "../constants";
import {
  INIT_CHANNEL_MAP,
  SELECT_REVISION,
  CLEAR_SELECTED_REVISIONS,
  RELEASE_REVISION_SUCCESS,
  CLOSE_CHANNEL_SUCCESS,
} from "../actions/channelMap";
import {
  ReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

type ChannelMapAction = ReleasesAction &
  (
    | {
        type: typeof INIT_CHANNEL_MAP;
        payload: { channelMap: ReleasesReduxState["channelMap"] };
      }
    | {
        type: typeof SELECT_REVISION;
        payload: {
          revision: ReleasesReduxState["revisions"][string];
          toggle: boolean;
        };
      }
    | {
        type: typeof CLEAR_SELECTED_REVISIONS;
        payload: never;
      }
    | {
        type: typeof RELEASE_REVISION_SUCCESS;
        payload: {
          revision: ReleasesReduxState["revisions"][string];
          channel: string;
        };
      }
    | {
        type: typeof CLOSE_CHANNEL_SUCCESS;
        payload: {
          channel: string;
        };
      }
  );

function selectRevision(
  state: ReleasesReduxState["channelMap"],
  revision: ReleasesReduxState["revisions"][string],
  toggle: boolean
) {
  const arch = revision.architectures[0];

  state = {
    ...state,
    [AVAILABLE]: { ...state[AVAILABLE] },
  };

  if (
    toggle &&
    state[AVAILABLE][arch] &&
    state[AVAILABLE][arch].revision === revision.revision
  ) {
    delete state[AVAILABLE][arch];
  } else {
    state[AVAILABLE][arch] = { ...revision };
  }

  return state;
}

function releaseRevision(
  state: ReleasesReduxState["channelMap"],
  revision: ReleasesReduxState["revisions"][string],
  channel: string
) {
  state = {
    ...state,
    [channel]: { ...state[channel] },
  };

  revision.architectures.forEach((arch) => {
    const currentlyReleased = state[channel][arch];

    // only update revision in channel map if it changed since last time
    if (
      !currentlyReleased ||
      currentlyReleased.revision !== revision.revision
    ) {
      state[channel][arch] = { ...revision };
    }
  });

  return state;
}

function closeChannel(
  state: ReleasesReduxState["channelMap"],
  channel: string
) {
  // if channel is already closed do nothing
  if (!state[channel]) {
    return state;
  }

  state = { ...state };
  delete state[channel];

  return state;
}

// contains channel map for each channel in current track
// also includes 'unassigned' fake channel to show selected unassigned revision
export default function channelMap(
  state: ReleasesReduxState["channelMap"] = {},
  action: ChannelMapAction
) {
  switch (action.type) {
    case INIT_CHANNEL_MAP:
      return {
        ...action.payload.channelMap,
      };
    case SELECT_REVISION:
      return selectRevision(
        state,
        action.payload.revision,
        action.payload.toggle
      );
    case CLEAR_SELECTED_REVISIONS:
      return {
        ...state,
        [AVAILABLE]: {},
      };
    case RELEASE_REVISION_SUCCESS:
      return releaseRevision(
        state,
        action.payload.revision,
        action.payload.channel
      );
    case CLOSE_CHANNEL_SUCCESS:
      return closeChannel(state, action.payload.channel);
    default:
      return state;
  }
}
