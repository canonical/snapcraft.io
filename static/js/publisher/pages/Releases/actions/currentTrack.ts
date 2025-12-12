import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

export const SET_CURRENT_TRACK = "SET_CURRENT_TRACK";

export type SetCurrentTrackAction = GenericReleasesAction<
  typeof SET_CURRENT_TRACK,
  {
    track: ReleasesReduxState["currentTrack"];
  }
>;

export type CurrentTrackAction = SetCurrentTrackAction;

export function setCurrentTrack(
  track: ReleasesReduxState["currentTrack"]
): SetCurrentTrackAction {
  return {
    type: SET_CURRENT_TRACK,
    payload: { track },
  };
}
