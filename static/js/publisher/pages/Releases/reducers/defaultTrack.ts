import { ReleasesReduxState } from "../../../types/releaseTypes";
import {
  SET_DEFAULT_TRACK_SUCCESS,
  DefaultTrackAction,
} from "../actions/defaultTrack";

export default function defaultTrack(
  state: ReleasesReduxState["defaultTrack"] = "latest",
  action: DefaultTrackAction
) {
  switch (action.type) {
    case SET_DEFAULT_TRACK_SUCCESS:
      return action.payload;
    default:
      return state;
  }
}
