export const SET_CURRENT_TRACK = "SET_CURRENT_TRACK";

export function setCurrentTrack(track) {
  return {
    type: SET_CURRENT_TRACK,
    payload: { track }
  };
}
