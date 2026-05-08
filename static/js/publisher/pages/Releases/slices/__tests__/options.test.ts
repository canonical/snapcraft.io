import { UnknownAction } from "@reduxjs/toolkit";
import reducer, { releasesReady, initOptions } from "../options";
import type { OptionsState } from "../../../../types/releaseTypes";

describe("options", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual({
      flags: {},
      snapName: "",
      releasesReady: false,
    });
  });

  describe("on options/releasesReady action", () => {
    it("should set releasesReady to true", () => {
      const result = reducer(undefined, releasesReady(true));
      expect(result.releasesReady).toBe(true);
    });

    it("should set releasesReady to false", () => {
      const initialState: OptionsState = {
        flags: {},
        snapName: "test",
        releasesReady: true,
      };
      const result = reducer(initialState, releasesReady(false));
      expect(result.releasesReady).toBe(false);
    });
  });

  describe("on options/initOptions action", () => {
    it("should replace the options state with given data", () => {
      const newOptions: OptionsState = {
        flags: { isProgressiveReleaseEnabled: true },
        snapName: "my-snap",
        releasesReady: false,
      };
      const result = reducer(undefined, initOptions(newOptions));
      expect(result).toEqual(newOptions);
    });
  });
});
