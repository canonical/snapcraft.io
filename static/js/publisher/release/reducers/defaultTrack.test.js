import defaultTrack from "./defaultTrack";

import { SET_DEFAULT_TRACK_SUCCESS } from "../actions/defaultTrack";

describe("defaultTrack", () => {
  it("should return the initial state", () => {
    expect(defaultTrack(undefined, {})).toEqual("latest");
  });

  describe("on SET_DEFAULT_TRACK_SUCESS", () => {
    it("should set the default track", () => {
      const result = defaultTrack(
        {},
        {
          type: SET_DEFAULT_TRACK_SUCCESS,
          payload: "test"
        }
      );

      expect(result).toEqual("test");
    });
  });
});
