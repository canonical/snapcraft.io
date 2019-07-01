import defaultTrack from "./defaultTrack";

import {
  SET_DEFAULT_TRACK_ERROR,
  SET_DEFAULT_TRACK_SUCCESS
} from "../actions/defaultTrack";

describe("defaultTrack", () => {
  it("should return the initial state", () => {
    expect(defaultTrack(undefined, {})).toEqual({
      track: "latest"
    });
  });

  describe("on SET_DEFAULT_TRACK_SUCESS", () => {
    it("should set the default track", () => {
      const result = defaultTrack(
        {},
        {
          type: SET_DEFAULT_TRACK_SUCCESS,
          payload: {
            track: "test"
          }
        }
      );

      expect(result).toEqual({
        track: "test"
      });
    });
  });

  describe("on SET_DEFAULT_TRACK_ERROR", () => {
    it("should set the default track", () => {
      const result = defaultTrack(
        {},
        {
          type: SET_DEFAULT_TRACK_ERROR,
          payload: {
            track: "test"
          }
        }
      );

      expect(result).toEqual({});
    });
  });
});
