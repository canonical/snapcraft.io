import { AVAILABLE } from "./constants";
import { getChannelName, isRevisionBuiltOnLauchpad } from "./helpers";

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
