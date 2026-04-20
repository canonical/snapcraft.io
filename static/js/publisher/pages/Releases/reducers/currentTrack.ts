import type { ReleasesReduxState } from "../../../types/releaseTypes";
import type { RootAction } from "../actions";
import {
  SET_CURRENT_TRACK,
} from "../actions/currentTrack";

export default function currentTrack(
  state: ReleasesReduxState["currentTrack"] = "",
  action: RootAction
) {
  switch (action.type) {
    case SET_CURRENT_TRACK:
      return action.payload.track;
    default:
      return state;
  }
}
