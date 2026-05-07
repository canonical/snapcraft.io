import { UnknownAction } from "@reduxjs/toolkit";
import reducer, { setCurrentTrack } from "../currentTrack";

describe("currentTrack", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual("");
  });

  describe("on currentTrack/setCurrentTrack action", () => {
    const track = "test";

    it("should set current track to given name", () => {
      const result = reducer("previousTrack", setCurrentTrack(track));
      expect(result).toEqual(track);
    });
  });
});
