import {
  SET_DEFAULT_TRACK_SUCCESS,
  SET_DEFAULT_TRACK_ERROR
} from "../actions/defaultTrack";

export default function defaultTrack(
  state = {
    track: "latest"
  },
  action
) {
  switch (action.type) {
    case SET_DEFAULT_TRACK_SUCCESS:
      return {
        ...state,
        track: action.payload.track
      };
    case SET_DEFAULT_TRACK_ERROR:
      return {
        ...state
      };
    default:
      return state;
  }
}
