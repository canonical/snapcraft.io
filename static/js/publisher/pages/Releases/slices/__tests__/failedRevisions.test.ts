import { UnknownAction } from "@reduxjs/toolkit";
import reducer, { updateFailedRevisions } from "../failedRevisions";
import type { FailedRevision } from "../../../../types/releaseTypes";

describe("failedRevisions", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual([]);
  });

  describe("on failedRevisions/updateFailedRevisions action", () => {
    const failedRevision: FailedRevision = {
      channel: "test/edge",
      architecture: "amd64",
    };

    it("should add failed revisions to state", () => {
      const result = reducer([], updateFailedRevisions([failedRevision]));
      expect(result).toContainEqual(failedRevision);
    });

    it("should append to existing failed revisions", () => {
      const existing: FailedRevision = { channel: "latest/stable", architecture: "arm64" };
      const result = reducer([existing], updateFailedRevisions([failedRevision]));
      expect(result).toContainEqual(existing);
      expect(result).toContainEqual(failedRevision);
    });

    it("should deduplicate failed revisions by channel and architecture", () => {
      const duplicate: FailedRevision = { channel: "test/edge", architecture: "amd64" };
      const result = reducer([failedRevision], updateFailedRevisions([duplicate]));
      expect(result.filter(r => r.channel === "test/edge" && r.architecture === "amd64")).toHaveLength(1);
    });
  });
});
