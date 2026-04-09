import { UnknownAction } from "@reduxjs/toolkit";
import reducer, {
  updateArchitectures,
} from "../architectures";
import type { ArchitecturesState } from "../../../../types/releaseTypes";
import {
  mockRevisions,
  mockRevisionsMultipleArchs,
} from "../../../../test-utils";

describe("architectures", () => {
  it("should return the initial state", () => {
    expect(
      reducer(undefined, {} as UnknownAction)
    ).toEqual([]);
  });

  describe("on architectures/updateArchitectures action", () => {
    const expectedArchitectures = ["arm64", "amd64", "armhf"] as ArchitecturesState;
    let updateArchitecturesAction: ReturnType<typeof updateArchitectures>;
    const mockActionPayload = [...mockRevisions, ...mockRevisionsMultipleArchs];

    beforeEach(() => {
      updateArchitecturesAction = updateArchitectures(mockActionPayload);
    });

    it("should add architectures to state", () => {
      const result = reducer([], updateArchitecturesAction);
      expect(result).toEqual(expectedArchitectures);
    });

    it("should replace existing architectures in state", () => {
      const initialState = ["invalid"] as ArchitecturesState;
      const result = reducer(initialState, updateArchitecturesAction);
      expect(result).toEqual(expectedArchitectures);
    });
  });
});
