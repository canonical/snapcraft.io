import { ReleasesReduxState } from "../../../types/releaseTypes";
import { RootAction } from "../actions";
import {
  SET_DEFAULT_TRACK_SUCCESS,
} from "../actions/defaultTrack";

export default function defaultTrack(
  state: ReleasesReduxState["defaultTrack"] = "latest",
  action: RootAction
) {
  switch (action.type) {
    case SET_DEFAULT_TRACK_SUCCESS:
      return action.payload;
    default:
      return state;
  }
}
