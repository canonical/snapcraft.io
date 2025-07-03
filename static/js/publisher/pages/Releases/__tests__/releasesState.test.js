import {
  getRevisionsMap,
  initReleasesData,
  getTrackingChannel,
} from "../releasesState";

import {
  mockRevisions,
  mockRevisionsMap,
  mockReleases,
  mockReleasesData,
  mockReleasedChannels,
} from "../../../test-utils";

describe("getRevisionsMap", () => {
  test("returns a revisions map", () => {
    expect(getRevisionsMap(mockRevisions)).toEqual(mockRevisionsMap);
  });
});

describe("initReleasesData", () => {
  test("returns releases data", () => {
    expect(initReleasesData(mockRevisionsMap, mockReleases)).toEqual(
      mockReleasesData,
    );
  });
});

describe("getTrackingChannel", () => {
  test("returns tracking channel", () => {
    expect(
      getTrackingChannel(
        mockReleasedChannels,
        "latest",
        "candidate",
        "ppc64el",
      ),
    ).toEqual("latest/stable");
  });
});
