import { AVAILABLE } from "./constants";
import { getChannelName } from "./helpers";

describe("getChannelName", () => {
  it("should return track/risk pair as a name", () => {
    expect(getChannelName("track", "risk")).toEqual("track/risk");
  });

  it("should return AVAILABLE if AVAILABLE is passed as risk", () => {
    expect(getChannelName("anything", AVAILABLE)).toEqual(AVAILABLE);
  });
});
