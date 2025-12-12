import { ReleasesReduxState } from "../../../types/releaseTypes";
import {
  SET_CURRENT_TRACK,
  SetCurrentTrackAction,
  CurrentTrackAction,
} from "../actions/currentTrack";

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
