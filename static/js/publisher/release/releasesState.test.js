import { getPendingRelease } from "./releasesState";

describe("getPendingRelease", () => {
  const pendingReleases = {
    "1": {
      "latest/stable": {
        channel: "latest/stable",
        revision: {
          revision: 1,
          architectures: ["amd64"]
        }
      },
      "latest/candidate": {
        channel: "latest/candidate",
        revision: {
          revision: 1,
          architectures: ["amd64"]
        }
      }
    }
  };

  it("should return the correct release", () => {
    const result = getPendingRelease(pendingReleases, "amd64", "latest/stable");

    expect(result).toEqual({
      ...pendingReleases["1"]["latest/stable"]
    });
  });
});
