import {
  SET_DEFAULT_TRACK,
  CLEAR_DEFAULT_TRACK,
  SET_DEFAULT_TRACK_SUCCESS,
  SET_DEFAULT_TRACK_ERROR,

  STATUS_SUCCESS,
  STATUS_ERROR,
  STATUS_SETTING,
  STATUS_CLEARING
} from "../actions/defaultTrack";

export default function currentTrack(
  state = {
    track: "latest",
    set: false,
    unset: false,
    success: false
  },
  action
) {
  switch (action.type) {
    case SET_DEFAULT_TRACK_SUCCESS:
      return {
        ...state,
        status: STATUS_SUCCESS,
        track: action.payload.track
      };
    case SET_DEFAULT_TRACK_ERROR:
      return {
        ...state,
        status: STATUS_ERROR
      };
    case SET_DEFAULT_TRACK:
      return {
        ...state,
        status: STATUS_SETTING
      };
    case CLEAR_DEFAULT_TRACK:
      return {
        ...state,
        status: STATUS_CLEARING
      };
    default:
      return state;
  }
}
