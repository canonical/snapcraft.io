import {
  SET_DEFAULT_TRACK_SUCCESS,
  SET_DEFAULT_TRACK_ERROR
} from "../actions/defaultTrack";

export default function currentTrack(
  state = {
    track: "latest",
    success: false
  },
  action
) {
  switch (action.type) {
    case SET_DEFAULT_TRACK_SUCCESS:
      return {
        ...state,
        success: true,
        track: action.payload.track
      };
    case SET_DEFAULT_TRACK_ERROR:
      return {
        ...state,
        success: false
      };
    default:
      return state;
  }
}
