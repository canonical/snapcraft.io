import {
  ReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { SET_CURRENT_TRACK } from "../actions/currentTrack";

type CurrentTrackAction = ReleasesAction & {
  payload: {
    track: ReleasesReduxState["currentTrack"];
  };
};

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
