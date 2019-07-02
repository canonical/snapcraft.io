import { SET_DEFAULT_TRACK_SUCCESS } from "../actions/defaultTrack";

export default function defaultTrack(state = "latest", action) {
  switch (action.type) {
    case SET_DEFAULT_TRACK_SUCCESS:
      return action.payload;
    default:
      return state;
  }
}
