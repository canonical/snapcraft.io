import currentTrack from "../currentTrack";
import { CurrentTrackAction, SetCurrentTrackAction } from "../../actions/currentTrack";

import { SET_CURRENT_TRACK } from "../../actions/currentTrack";

describe("currentTrack", () => {
  it("should return the initial state", () => {
    expect(currentTrack(undefined, {} as CurrentTrackAction)).toEqual("");
  });

  describe("on SET_CURRENT_TRACK action", () => {
    const track = "test";
    const setCurrentTrackAction: SetCurrentTrackAction = {
      type: SET_CURRENT_TRACK,
      payload: { track },
    };

    it("should set current track to given name", () => {
      const result = currentTrack("previousTrack", setCurrentTrackAction);

      expect(result).toEqual(track);
    });
  });
});
