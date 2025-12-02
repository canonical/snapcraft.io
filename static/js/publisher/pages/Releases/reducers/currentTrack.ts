import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { SET_CURRENT_TRACK } from "../actions/currentTrack";

export type SetCurrentTrackAction = GenericReleasesAction<
  typeof SET_CURRENT_TRACK,
  {
    track: ReleasesReduxState["currentTrack"];
  }
>;

export type CurrentTrackAction = SetCurrentTrackAction;

export default function currentTrack(
  state: ReleasesReduxState["currentTrack"] = "",
  action: CurrentTrackAction
) {
  switch (action.type) {
    case SET_CURRENT_TRACK:
      return action.payload.track;
    default:
      return state;
  }
}
