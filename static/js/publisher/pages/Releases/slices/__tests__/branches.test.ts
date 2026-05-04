import { UnknownAction } from "@reduxjs/toolkit";
import reducer, { openBranches, closeBranches, toggleBranches } from "../branches";
import type { AppDispatch, RootState } from "../../store";

describe("branches", () => {
  it("should return an initial empty state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual([]);
  });

  describe("on branches/openBranches action", () => {
    it("should add branch to branches list", () => {
      const result = reducer([], openBranches("test"));
      expect(result).toEqual(["test"]);
    });

    it("should not add duplicate branch", () => {
      const result = reducer(["test"], openBranches("test"));
      expect(result).toEqual(["test"]);
    });
  });

  describe("on branches/closeBranches action", () => {
    it("should remove branch from branches list", () => {
      const state = ["testing123", "test", "McTestFace", "testtest"];
      const result = reducer(state, closeBranches("test"));
      expect(result).toEqual(["testing123", "McTestFace", "testtest"]);
    });
  });

  describe("toggleBranches", () => {
    it("should dispatch openBranches if branch is not in branches list", () => {
      const dispatch = vi.fn() as unknown as AppDispatch;
      const getState = () => ({ branches: [] } as unknown as RootState);

      toggleBranches("test")(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith(openBranches("test"));
    });

    it("should dispatch closeBranches if branch is in branches list", () => {
      const dispatch = vi.fn() as unknown as AppDispatch;
      const getState = () => ({ branches: ["test"] } as unknown as RootState);

      toggleBranches("test")(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith(closeBranches("test"));
    });
  });
});
