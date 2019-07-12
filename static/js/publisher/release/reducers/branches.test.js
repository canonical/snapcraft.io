import branches from "./branches";
import { OPEN_BRANCHES, CLOSE_BRANCHES } from "../actions/branches";

describe("branches", () => {
  it("should return an initial empty state", () => {
    expect(branches(undefined, {})).toEqual([]);
  });

  describe("on OPEN_BRANCHES action", () => {
    it("should add branch to branches list", () => {
      const action = {
        type: OPEN_BRANCHES,
        payload: "test"
      };

      const result = branches(undefined, action);

      expect(result).toEqual(["test"]);
    });
  });

  describe("on CLOSE_BRANCHES action", () => {
    it("should remove branch from branches list", () => {
      const action = {
        type: CLOSE_BRANCHES,
        payload: "test"
      };

      const state = ["testing123", "test", "McTestFace", "testtest"];

      const results = branches(state, action);

      expect(results).toEqual(["testing123", "McTestFace", "testtest"]);
    });
  });
});
