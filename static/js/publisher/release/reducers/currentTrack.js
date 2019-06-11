import { SET_CURRENT_TRACK } from "../actions/currentTrack";

export default function currentTrack(state = "", action) {
  switch (action.type) {
    case SET_CURRENT_TRACK:
      return action.payload.track;
    default:
      return state;
  }
}
