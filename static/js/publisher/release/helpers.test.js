import { AVAILABLE } from "./constants";
import {
  getChannelName,
  isRevisionBuiltOnLauchpad,
  getRevisionsArchitectures,
  isSameVersion
} from "./helpers";

describe("getChannelName", () => {
  it("should return track/risk pair as a name", () => {
    expect(getChannelName("track", "risk")).toEqual("track/risk");
  });

  it("should return track/risk/branch pair as a name", () => {
    expect(getChannelName("track", "risk", "branch")).toEqual(
      "track/risk/branch"
    );
  });

  it("should return AVAILABLE if AVAILABLE is passed as risk", () => {
    expect(getChannelName("anything", AVAILABLE)).toEqual(AVAILABLE);
  });
});

describe("isRevisionBuiltOnLauchpad", () => {
  it("should return false for revision without build request id", () => {
    expect(isRevisionBuiltOnLauchpad({ revision: 1 })).toBe(false);
  });

  it("should return false for revision without Lauchpad build request id", () => {
    expect(
      isRevisionBuiltOnLauchpad({
        revision: 1,
        attributes: { "build-request-id": "something-else" }
      })
    ).toBe(false);
  });

  it("should return true for revision with Lauchpad build request id", () => {
    expect(
      isRevisionBuiltOnLauchpad({
        revision: 1,
        version: "1",
        attributes: { "build-request-id": "lp-123" }
      })
    ).toBe(true);
  });
});

describe("getRevisionsArchitectures", () => {
  it("should return unique and sorted list of architectures from all revisoins", () => {
    const revisions = [
      { architectures: ["test4"] },
      { architectures: ["test2"] },
      { architectures: ["test3", "test2", "test1"] },
      { architectures: ["test3", "test4"] }
    ];
    expect(getRevisionsArchitectures(revisions)).toEqual([
      "test1",
      "test2",
      "test3",
      "test4"
    ]);
  });
});

describe("isSameVersion", () => {
  it("should return true if all revisions have same version", () => {
    const revisions = [
      { version: "test" },
      { version: "test" },
      { version: "test" },
      { version: "test" }
    ];
    expect(isSameVersion(revisions)).toBe(true);
  });

  it("should return false if revisions don't have same version", () => {
    const revisions = [
      { version: "test" },
      { version: "test2" },
      { version: "test" },
      { version: "test2" }
    ];
    expect(isSameVersion(revisions)).toBe(false);
  });
});
