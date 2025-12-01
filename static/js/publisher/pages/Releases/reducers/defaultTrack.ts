import {
  ReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { SET_DEFAULT_TRACK_SUCCESS } from "../actions/defaultTrack";

type DefaultTrackAction = ReleasesAction & {
  payload: ReleasesReduxState["defaultTrack"];
};

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
