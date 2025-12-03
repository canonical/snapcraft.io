import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { CLOSE_CHANNEL } from "../actions/pendingCloses";
import {
  RELEASE_REVISION,
  CANCEL_PENDING_RELEASES,
} from "../actions/pendingReleases";

export type CloseChannelAction = GenericReleasesAction<
  typeof CLOSE_CHANNEL,
  {
    channel: string;
  }
>;

export type ReleaseRevisionAction = GenericReleasesAction<
  typeof RELEASE_REVISION,
  {
    channel: string;
  }
>;

export type CancelPendingReleasesAction = GenericReleasesAction<
  typeof CANCEL_PENDING_RELEASES,
  never
>;

export type PendingClosesAction =
  | CloseChannelAction
  | ReleaseRevisionAction
  | CancelPendingReleasesAction;

// channels to be closed:
// [ "track/risk", ... ]
export default function pendingCloses(
  state: ReleasesReduxState["pendingCloses"] = [],
  action: PendingClosesAction
) {
  switch (action.type) {
    case CLOSE_CHANNEL:
      if (state.includes(action.payload.channel)) {
        return state;
      }
      return [...state, action.payload.channel];
    case RELEASE_REVISION:
      if (!state.includes(action.payload.channel)) {
        return state;
      }
      state = [...state];
      // remove channel released to from closing channels
      state.splice(state.indexOf(action.payload.channel), 1);
      return state;
    case CANCEL_PENDING_RELEASES:
      return [];
    default:
      return state;
  }
}
