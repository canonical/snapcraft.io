import { UnknownAction } from "@reduxjs/toolkit";
import reducer, { updateRevisions } from "../revisions";
import type { RevisionsState } from "../../../../types/releaseTypes";

describe("revisions", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual({});
  });

  describe("on revisions/updateRevisions action", () => {
    const newRevisions = {
      1: { revision: 1 },
      2: { revision: 2 },
      3: { revision: 3, channels: ["stable"] },
    } as unknown as RevisionsState;

    it("should add revisions to state", () => {
      const result = reducer({}, updateRevisions(newRevisions));
      expect(result).toEqual(newRevisions);
    });

    it("should replace existing revisions in state", () => {
      const initialState = {
        1: { revision: 1 },
        3: { revision: 3 },
      } as unknown as RevisionsState;

      const result = reducer(initialState, updateRevisions(newRevisions));
      expect(result).toEqual(newRevisions);
    });
  });
});
