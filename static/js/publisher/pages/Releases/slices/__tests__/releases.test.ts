import { UnknownAction } from "@reduxjs/toolkit";
import reducer, { updateReleases } from "../releases";
import type { ReleasesState } from "../../../../types/releaseTypes";

describe("releases", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual([]);
  });

  describe("on releases/updateReleases action", () => {
    const newReleases = [
      { revision: 1 },
      { revision: 2 },
      { revision: 3 },
    ] as unknown as ReleasesState;

    it("should set releases to the given list", () => {
      const result = reducer([], updateReleases(newReleases));
      expect(result).toEqual(newReleases);
    });

    it("should replace existing releases in state", () => {
      const initialState = [
        { revision: 5 },
        { revision: 6 },
      ] as unknown as ReleasesState;

      const result = reducer(initialState, updateReleases(newReleases));
      expect(result).toEqual(newReleases);
    });
  });
});
