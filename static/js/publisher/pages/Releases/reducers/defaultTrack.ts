import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { SET_DEFAULT_TRACK_SUCCESS } from "../actions/defaultTrack";

export type SetDefaultTrackAction = GenericReleasesAction<
  typeof SET_DEFAULT_TRACK_SUCCESS,
  ReleasesReduxState["defaultTrack"]
>;

export type DefaultTrackAction = SetDefaultTrackAction;

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
