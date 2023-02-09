import {
  AVAILABLE,
  AVAILABLE_REVISIONS_SELECT_ALL,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
} from "../constants";
import {
  getFilteredReleaseHistory,
  getSelectedRevision,
  getSelectedRevisions,
  getSelectedArchitectures,
  getPendingChannelMap,
  hasDevmodeRevisions,
  hasPendingRelease,
  getFilteredAvailableRevisions,
  getFilteredAvailableRevisionsForArch,
  getArchitectures,
  getTracks,
  getTrackRevisions,
  getBranches,
  hasBuildRequestId,
  getLaunchpadRevisions,
  getRevisionsFromBuild,
  getProgressiveState,
  isProgressiveReleaseEnabled,
  hasRelease,
  getSeparatePendingReleases,
  getPendingRelease,
  getReleases,
} from "./index";

import reducers from "../reducers";

describe("getFilteredReleaseHistory", () => {
  const initialState = reducers(undefined, {});
  const stateWithRevisions = {
    ...initialState,
    revisions: {
      1: { revision: 1, version: "1" },
      2: { revision: 2, version: "2" },
      3: { revision: 3, version: "3" },
    },
  };

  it("should return empty list for initial state", () => {
    expect(getFilteredReleaseHistory(initialState)).toEqual([]);
  });

  it("should return only releases of revisions (ignore closing channels)", () => {
    const state = {
      ...stateWithRevisions,
      releases: [
        { risk: "test", revision: 1 },
        { risk: "test" },
        { risk: "test", revision: 2 },
      ],
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    expect(filteredHistory.every((r) => r.revision)).toBe(true);
  });

  it("should return only releases in given architecture", () => {
    const state = {
      ...stateWithRevisions,
      releases: [
        { architecture: "test", revision: 1 },
        { architecture: "test", revision: 2 },
        { architecture: "abcd", revision: 2 },
        { architecture: "test", revision: 3 },
      ],
      history: {
        filters: {
          arch: "test",
        },
      },
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    const isEveryReleaseInTestArch = filteredHistory.every(
      (r) => r.release.architecture === "test"
    );
    expect(isEveryReleaseInTestArch).toBe(true);
  });

  it("should return only releases in given track", () => {
    const state = {
      ...stateWithRevisions,
      releases: [
        { track: "test", revision: 1 },
        { track: "test", revision: 2 },
        { track: "abcd", revision: 2 },
        { track: "test", revision: 3 },
      ],
      history: {
        filters: {
          track: "test",
        },
      },
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    const isEveryReleaseInTestTrack = filteredHistory.every(
      (r) => r.release.track === "test"
    );
    expect(isEveryReleaseInTestTrack).toBe(true);
  });

  it("should return only releases in given risk", () => {
    const state = {
      ...stateWithRevisions,
      releases: [
        { risk: "test", revision: 1 },
        { risk: "test", revision: 2 },
        { risk: "abcd", revision: 2 },
        { risk: "test", revision: 3 },
      ],
      history: {
        filters: {
          risk: "test",
        },
      },
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    const isEveryReleaseInTestRisk = filteredHistory.every(
      (r) => r.release.risk === "test"
    );
    expect(isEveryReleaseInTestRisk).toBe(true);
  });

  it("should return only releases in given branch", () => {
    const state = {
      ...stateWithRevisions,
      releases: [
        { branch: "test", revision: 1 },
        { revision: 1 },
        { revision: 2 },
      ],
      history: {
        filters: {
          branch: "test",
        },
      },
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    const isEveryReleaseInTestBranch = filteredHistory.every(
      (r) => r.release.branch === "test"
    );
    expect(isEveryReleaseInTestBranch).toBe(true);
  });

  it("should return only one latest release of every revision", () => {
    const state = {
      ...stateWithRevisions,
      releases: [
        { revision: 1 },
        { revision: 2 },
        { revision: 1 },
        { revision: 3 },
      ],
    };

    const filteredRevisions = getFilteredReleaseHistory(state).map(
      (r) => r.revision
    );

    const isUnique =
      new Set(filteredRevisions).size === filteredRevisions.length;

    expect(isUnique).toBe(true);
  });
});

describe("getSelectedRevisions", () => {
  const initialState = reducers(undefined, {});

  const stateWithSelectedRevisions = {
    ...initialState,
    channelMap: {
      [AVAILABLE]: {
        abc42: { revision: 1, version: "1" },
        test64: { revision: 2, version: "2" },
      },
    },
  };

  it("should be empty for initial state", () => {
    expect(getSelectedRevisions(initialState)).toHaveLength(0);
  });

  it("should return list of selected revision ids", () => {
    expect(getSelectedRevisions(stateWithSelectedRevisions)).toEqual([1, 2]);
  });
});

describe("getSelectedRevision", () => {
  const initialState = reducers(undefined, {});

  const stateWithSelectedRevisions = {
    ...initialState,
    channelMap: {
      [AVAILABLE]: {
        abc42: { revision: 1, version: "1" },
        test64: { revision: 2, version: "2" },
      },
    },
  };

  it("should be empty for initial state", () => {
    expect(getSelectedRevision(initialState, "test64")).toBeUndefined();
  });

  it("should return revision selected in given arch", () => {
    expect(getSelectedRevision(stateWithSelectedRevisions, "test64")).toEqual(
      stateWithSelectedRevisions.channelMap[AVAILABLE]["test64"]
    );
  });
});

describe("getSelectedArchitectures", () => {
  const initialState = reducers(undefined, {});

  const stateWithSelectedRevisions = {
    ...initialState,
    channelMap: {
      [AVAILABLE]: {
        abc42: { revision: 1, version: "1" },
        test64: { revision: 2, version: "2" },
      },
    },
  };

  it("should be empty for initial state", () => {
    expect(getSelectedArchitectures(initialState)).toHaveLength(0);
  });

  it("should return list of selected revision ids", () => {
    expect(getSelectedArchitectures(stateWithSelectedRevisions)).toEqual([
      "abc42",
      "test64",
    ]);
  });
});

describe("hasDevmodeRevisions", () => {
  const initialState = reducers(undefined, {});
  const stateWithReleasedRevisions = {
    ...initialState,
    channelMap: {
      "test/edge": {
        abc42: { revision: 1, version: "1" },
        test64: { revision: 2, version: "2" },
        armf: { revision: 3, version: "3" },
      },
    },
  };

  const stateWithConfinementDevmode = {
    ...initialState,
    channelMap: {
      "test/edge": {
        abc42: { revision: 1, version: "1" },
        test64: { revision: 2, version: "2", confinement: "devmode" },
        armf: { revision: 3, version: "3" },
      },
    },
  };

  const stateWithGradeDevel = {
    ...initialState,
    channelMap: {
      "test/edge": {
        abc42: { revision: 1, version: "1" },
        test64: { revision: 2, version: "2", grade: "devel" },
        armf: { revision: 3, version: "3" },
      },
    },
  };

  it("should be false for initial empty state", () => {
    expect(hasDevmodeRevisions(initialState)).toBe(false);
  });

  it("should be false if none of released revisions is in devmode or devel grade", () => {
    expect(hasDevmodeRevisions(stateWithReleasedRevisions)).toBe(false);
  });

  it("should be true if any revision has devmode confinement", () => {
    expect(hasDevmodeRevisions(stateWithConfinementDevmode)).toBe(true);
  });

  it("should be true if any revision has devel grade", () => {
    expect(hasDevmodeRevisions(stateWithGradeDevel)).toBe(true);
  });
});

describe("getPendingChannelMap", () => {
  describe("when there are no pending releases", () => {
    const stateWithNoPendingReleases = {
      channelMap: {
        "test/edge": {
          test64: { revision: 1 },
        },
      },
      pendingReleases: {},
    };

    it("should return channel map as it is", () => {
      expect(getPendingChannelMap(stateWithNoPendingReleases)).toEqual(
        stateWithNoPendingReleases.channelMap
      );
    });
  });

  describe("when there are pending releases to other channels", () => {
    const stateWithPendingReleases = {
      channelMap: {
        "test/edge": {
          test64: { revision: 1 },
        },
      },
      pendingReleases: {
        2: {
          "latest/stable": {
            revision: { revision: 2, architectures: ["test64"] },
            channel: "latest/stable",
          },
        },
      },
    };

    it("should return channel map with pending revisions added", () => {
      expect(getPendingChannelMap(stateWithPendingReleases)).toEqual({
        ...stateWithPendingReleases.channelMap,
        "latest/stable": {
          test64: {
            ...stateWithPendingReleases.pendingReleases["2"]["latest/stable"]
              .revision,
          },
        },
      });
    });
  });

  describe("when there are pending releases overriding existing releases", () => {
    const stateWithPendingReleases = {
      channelMap: {
        "test/edge": {
          test64: { revision: 1 },
        },
      },
      pendingReleases: {
        2: {
          "test/edge": {
            revision: { revision: 2, architectures: ["test64"] },
            channel: "test/edge",
          },
        },
      },
    };

    it("should return channel map with pending revisions", () => {
      expect(getPendingChannelMap(stateWithPendingReleases)).toEqual({
        ...stateWithPendingReleases.channelMap,
        "test/edge": {
          test64: {
            ...stateWithPendingReleases.pendingReleases["2"]["test/edge"]
              .revision,
          },
        },
      });
    });
  });
});

describe("getFilteredAvailableRevisions", () => {
  const initialState = reducers(undefined, {});

  const dayAgo = new Date();
  dayAgo.setDate(dayAgo.getDate() - 1);

  const moreThenWeekAgo = new Date();
  moreThenWeekAgo.setDate(moreThenWeekAgo.getDate() - 8);

  const stateWithRevisions = {
    ...initialState,
    revisions: {
      1: { revision: 1, version: "1", created_at: dayAgo },
      2: {
        revision: 2,
        version: "2",
        channels: [],
        created_at: moreThenWeekAgo,
      },
      3: {
        revision: 3,
        version: "3",
        channels: ["test/edge"],
        created_at: dayAgo,
      },
      4: {
        revision: 4,
        version: "4",
        channels: ["test/edge"],
        created_at: moreThenWeekAgo,
        attributes: { "build-request-id": "lp-1234" },
      },
    },
  };

  describe("when there are no revisions", () => {
    it("should return empty list", () => {
      expect(getFilteredAvailableRevisions(initialState)).toEqual([]);
    });
  });

  describe("when there are some revisions in state", () => {
    describe("when 'All' is selected in available revisions select", () => {
      const stateWithAllSelected = {
        ...stateWithRevisions,
        availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_ALL,
      };

      it("should return all revisions by default", () => {
        expect(getFilteredAvailableRevisions(stateWithAllSelected)).toEqual([
          stateWithAllSelected.revisions[4],
          stateWithAllSelected.revisions[3],
          stateWithAllSelected.revisions[2],
          stateWithAllSelected.revisions[1],
        ]);
      });
    });

    describe("when 'Unreleased' are selected in available revisions select", () => {
      const stateWithUnreleasedSelected = {
        ...stateWithRevisions,
        availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_UNRELEASED,
      };

      it("should return only unreleased revisions", () => {
        expect(
          getFilteredAvailableRevisions(stateWithUnreleasedSelected)
        ).toEqual([
          stateWithUnreleasedSelected.revisions[2],
          stateWithUnreleasedSelected.revisions[1],
        ]);
      });
    });

    describe("when 'Recent' are selected in available revisions select", () => {
      const stateWithRecentSelected = {
        ...stateWithRevisions,
        availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_RECENT,
      };

      it("should return unreleased revisions not older then a week", () => {
        expect(getFilteredAvailableRevisions(stateWithRecentSelected)).toEqual([
          stateWithRecentSelected.revisions[1],
        ]);
      });
    });

    describe("when 'Lauchpad' is selected in available revisions select", () => {
      const stateWithLaunchpadSelected = {
        ...stateWithRevisions,
        availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
      };

      it("should return unreleased revisions not older then a week", () => {
        expect(
          getFilteredAvailableRevisions(stateWithLaunchpadSelected)
        ).toEqual([stateWithLaunchpadSelected.revisions[4]]);
      });
    });
  });
});

describe("getFilteredAvailableRevisionsByArch", () => {
  const arch = "test64";
  const initialState = reducers(undefined, {});
  const stateWithRevisions = {
    ...initialState,
    revisions: {
      1: { revision: 1, architectures: [arch], version: "1" },
      2: { revision: 2, architectures: ["amd42"], version: "2", channels: [] },
      3: {
        revision: 3,
        architectures: [arch, "amd42"],
        version: "3",
        channels: ["test/edge"],
      },
    },
  };

  describe("when there are no revisions", () => {
    it("should return empty list", () => {
      expect(getFilteredAvailableRevisionsForArch(initialState, arch)).toEqual(
        []
      );
    });
  });

  describe("when there are some revisions in state", () => {
    const stateWithAllSelected = {
      ...stateWithRevisions,
      availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_ALL,
    };

    it("should return selected revisions by for given architecture", () => {
      expect(
        getFilteredAvailableRevisionsForArch(stateWithAllSelected, arch)
      ).toEqual([
        stateWithAllSelected.revisions[3],
        stateWithAllSelected.revisions[1],
      ]);
    });
  });
});

describe("getArchitectures", () => {
  const initialState = reducers(undefined, {});
  const stateWithArchitectures = {
    ...initialState,
    architectures: ["test64", "amd42", "abc64"],
  };

  it("should return alphabetical list of all architectures", () => {
    expect(getArchitectures(stateWithArchitectures)).toEqual([
      "abc64",
      "amd42",
      "test64",
    ]);
  });
});

describe("getTracks", () => {
  const initialState = reducers(undefined, {});
  const stateWithReleases = {
    ...initialState,
    options: {
      tracks: [
        { name: "latest" },
        { name: "test" },
        { name: "latest" },
        { name: "12" },
      ],
    },
  };

  it("should return list of all tracks", () => {
    expect(getTracks(stateWithReleases)).toEqual(["latest", "test", "12"]);
  });
});

describe("hasPendingRelease", () => {
  describe("when there are no pending releases", () => {
    const stateWithNoPendingReleases = {
      channelMap: {
        "test/edge": {
          test64: { revision: 1 },
        },
      },
      pendingReleases: {},
    };

    it("should return false", () => {
      expect(
        hasPendingRelease(stateWithNoPendingReleases, "test/edge", "test64")
      ).toBe(false);
    });
  });

  describe("when there are pending releases to other channels", () => {
    const stateWithPendingReleases = {
      channelMap: {
        "test/edge": {
          test64: { revision: 1 },
        },
      },
      pendingReleases: {
        2: {
          "latest/stable": {
            revision: { revision: 2, architectures: ["test64"] },
            channel: "latest/stable",
          },
        },
      },
    };

    it("should return false for channel/arch without pending release", () => {
      expect(
        hasPendingRelease(stateWithPendingReleases, "test/edge", "test64")
      ).toBe(false);
    });

    it("should return true for channel/arch with pending release", () => {
      expect(
        hasPendingRelease(stateWithPendingReleases, "latest/stable", "test64")
      ).toBe(true);
    });
  });

  describe("when there are pending releases overriding existing releases", () => {
    const stateWithPendingReleases = {
      channelMap: {
        "test/edge": {
          test64: { revision: 1 },
        },
      },
      pendingReleases: {
        2: {
          "test/edge": {
            revision: { revision: 2, architectures: ["test64"] },
            channel: "test/edge",
          },
        },
      },
    };

    it("should return true for channel/arch with pending release", () => {
      expect(
        hasPendingRelease(stateWithPendingReleases, "test/edge", "test64")
      ).toBe(true);
    });
  });
});

describe("getTrackRevisions", () => {
  it("should return revisions in a given track", () => {
    const channelMap = {
      "test/edge": {
        test64: { revision: 1 },
      },
      stable: {
        test64: { revision: 1 },
      },
      "test/stable": {
        test64: { revision: 2 },
      },
    };

    expect(getTrackRevisions({ channelMap }, "test")).toEqual([
      {
        test64: {
          revision: 1,
        },
      },
      {
        test64: {
          revision: 2,
        },
      },
    ]);
  });
});

describe("getBranches", () => {
  it("should return branches on the currentTrack, ordered by oldest first", () => {
    const today = new Date();
    const expired = new Date(
      new Date().setDate(today.getDate() - 1)
    ).toISOString();
    const notExpired = new Date(
      new Date().setDate(today.getDate() + 24)
    ).toISOString();

    const state = {
      currentTrack: "latest",
      releases: [
        {
          branch: null,
          track: "latest",
          risk: "stable",
          revision: "1",
          when: today.toISOString(),
          "expiration-date": notExpired,
        },
        {
          branch: "test",
          track: "latest",
          risk: "stable",
          revision: "2",
          when: today.toISOString(),
          "expiration-date": notExpired,
        },
        {
          branch: "test2",
          track: "latest",
          risk: "stable",
          revision: "3",
          when: today.toISOString(),
          "expiration-date": notExpired,
        },
        {
          branch: "test",
          track: "test",
          risk: "stable",
          revision: "4",
          when: today.toISOString(),
          "expiration-date": expired,
        },
      ],
    };

    expect(getBranches(state)).toEqual([
      {
        branch: "test2",
        track: "latest",
        risk: "stable",
        revision: "3",
        when: today.toISOString(),
        expiration: notExpired,
      },
      {
        branch: "test",
        track: "latest",
        risk: "stable",
        revision: "2",
        when: today.toISOString(),
        expiration: notExpired,
      },
    ]);
  });
});

describe("hasBuildRequestId", () => {
  const initialState = reducers(undefined, {});
  const stateWithoutBuildRequestId = {
    ...initialState,
    revisions: {
      1: { revision: 1, version: "1" },
      2: { revision: 2, version: "2" },
      3: { revision: 3, version: "3" },
    },
  };
  const stateWithBuildRequestId = {
    ...stateWithoutBuildRequestId,
    revisions: {
      ...stateWithoutBuildRequestId.revisions,
      4: {
        revision: 4,
        version: "4",
        attributes: { "build-request-id": "test-1234" },
      },
    },
  };
  it("should return false if none of the revisions have build-request-id attribute", () => {
    expect(hasBuildRequestId(stateWithoutBuildRequestId)).toBe(false);
  });

  it("should return true if any of the revisions have build-request-id attribute", () => {
    expect(hasBuildRequestId(stateWithBuildRequestId)).toBe(true);
  });
});

describe("getLaunchpadRevisions", () => {
  const initialState = reducers(undefined, {});
  const stateWithLauchpadBuilds = {
    ...initialState,
    revisions: {
      1: { revision: 1, version: "1" },
      2: { revision: 2, version: "2" },
      3: {
        revision: 3,
        version: "3",
        attributes: { "build-request-id": "lp-1234" },
      },
      4: {
        revision: 4,
        version: "4",
        attributes: { "build-request-id": "lp-1234" },
      },
    },
  };

  it("should return only revisions with Lauchpad builds", () => {
    expect(getLaunchpadRevisions(stateWithLauchpadBuilds).length).toEqual(2);
    expect(getLaunchpadRevisions(stateWithLauchpadBuilds)).not.toContain(
      stateWithLauchpadBuilds.revisions[1],
      stateWithLauchpadBuilds.revisions[2]
    );
    expect(getLaunchpadRevisions(stateWithLauchpadBuilds)).toContain(
      stateWithLauchpadBuilds.revisions[3],
      stateWithLauchpadBuilds.revisions[4]
    );
  });
});

describe("getRevisionsFromBuild", () => {
  const initialState = reducers(undefined, {});
  const stateWithLauchpadBuilds = {
    ...initialState,
    revisions: {
      1: { revision: 1, version: "1" },
      2: { revision: 2, version: "2" },
      3: {
        revision: 3,
        version: "3",
        attributes: { "build-request-id": "lp-1234" },
      },
      4: {
        revision: 4,
        version: "4",
        attributes: { "build-request-id": "lp-1234" },
      },
      5: {
        revision: 5,
        version: "5",
        attributes: { "build-request-id": "lp-5432" },
      },
    },
  };

  it("should return only revisions with given build id", () => {
    const revisions = getRevisionsFromBuild(stateWithLauchpadBuilds, "lp-1234");
    expect(revisions.length).toEqual(2);
    expect(revisions).not.toContain(
      stateWithLauchpadBuilds.revisions[1],
      stateWithLauchpadBuilds.revisions[2],
      stateWithLauchpadBuilds.revisions[5]
    );
    expect(revisions).toContain(
      stateWithLauchpadBuilds.revisions[3],
      stateWithLauchpadBuilds.revisions[4]
    );
  });
});

describe("getProgressiveState", () => {
  const initialState = reducers(undefined, {});
  const stateWithProgressiveEnabled = {
    ...initialState,
    options: {
      ...initialState.options,
      flags: {
        isProgressiveReleaseEnabled: true,
      },
    },
    releases: [
      {
        architecture: "arch1",
        branch: null,
        track: "latest",
        risk: "stable",
        revision: "1",
        progressive: null,
      },
      {
        architecture: "arch2",
        branch: null,
        track: "latest",
        risk: "stable",
        revision: "3",
        progressive: {
          key: "test",
          percentage: 60,
          paused: false,
        },
      },
      {
        architecture: "arch2",
        branch: null,
        track: "latest",
        risk: "stable",
        revision: "2",
        progressive: {
          key: "test",
          percentage: 50,
          paused: false,
        },
      },
    ],
    revisions: {
      3: "revision3",
      2: "revision2",
    },
  };

  const stateWithProgressiveDisabled = {
    ...stateWithProgressiveEnabled,
    options: {
      ...initialState.options,
      flags: {
        isProgressiveReleaseEnabled: false,
      },
    },
  };

  const stateWithProgressiveEnabledAndPendingRelease = {
    ...stateWithProgressiveEnabled,
    pendingReleases: {
      3: {
        "latest/stable": {
          revision: { revision: "3", architectures: ["arch2"] },
          channel: "latest/stable",
          progressive: {
            key: "progressive-test",
            percentage: 40,
            paused: false,
          },
        },
      },
    },
  };

  it("should return the progressive release state of a channel and arch", () => {
    expect(
      getProgressiveState(stateWithProgressiveEnabled, "latest/stable", "arch2")
    ).toEqual(["revision2", null]);
  });

  it("should return the progressiveState and pendingProgressiveStatus", () => {
    expect(
      getProgressiveState(
        stateWithProgressiveEnabledAndPendingRelease,
        "latest/stable",
        "arch2"
      )
    ).toEqual([
      "revision2",
      { key: "progressive-test", paused: false, percentage: 40 },
    ]);
  });

  it("should return array of nulls if progressive release flag is disabled", () => {
    expect(
      getProgressiveState(
        stateWithProgressiveDisabled,
        "latest/stable",
        "arch2"
      )
    ).toEqual([null, null, null]);
  });
});

describe("isProgressiveReleaseEnabled", () => {
  const initialState = reducers(undefined, {});
  const stateWithProgressiveEnabled = {
    ...initialState,
    options: {
      ...initialState.options,
      flags: {
        isProgressiveReleaseEnabled: true,
      },
    },
  };

  const stateWithProgressiveDisabled = {
    ...initialState,
    options: {
      ...initialState.options,
      flags: {
        isProgressiveReleaseEnabled: false,
      },
    },
  };

  it("should be true with isProgressiveReleaseEnabled flag turned on", () => {
    expect(isProgressiveReleaseEnabled(stateWithProgressiveEnabled)).toBe(true);
  });

  it("should be false with isProgressiveReleaseEnabled flag turned off", () => {
    expect(isProgressiveReleaseEnabled(stateWithProgressiveDisabled)).toBe(
      false
    );
  });
});

describe("hasRelease", () => {
  const initialState = reducers(undefined, {});
  const stateWithARelease = {
    ...initialState,
    releases: [
      { architecture: "arm64", risk: "beta", track: "latest", revision: 1 },
    ],
  };
  const stateWithAClose = {
    ...initialState,
    releases: [
      { architecture: "arm64", risk: "beta", track: "latest", revision: null },
    ],
  };
  const stateWithMultipleArchAndChannels = {
    ...initialState,
    releases: [
      { architecture: "amd64", risk: "stable", track: "latest", revision: 1 },
      {
        architecture: "arm64",
        risk: "candidate",
        track: "latest",
        revision: 2,
      },
      {
        architecture: "arm64",
        risk: "stable",
        track: "latest",
        revision: null,
      },
      { architecture: "arm64", risk: "beta", track: "latest", revision: 3 },
    ],
  };

  it("should return false if there are no releases", () => {
    expect(hasRelease(initialState, "latest/beta", "arm64")).toBe(false);
  });

  it("should return false if the previous release was a close", () => {
    expect(hasRelease(stateWithAClose, "latest/beta", "arm64")).toBe(false);
    expect(
      hasRelease(stateWithMultipleArchAndChannels, "latest/stable", "arm64")
    ).toBe(false);
  });

  it("should return true if there is a previous release", () => {
    expect(hasRelease(stateWithARelease, "latest/beta", "arm64")).toBe(true);
    expect(
      hasRelease(stateWithMultipleArchAndChannels, "latest/beta", "arm64")
    ).toBe(true);
  });

  describe("getSeparatePendingReleases", () => {
    const initialState = reducers(undefined, {});

    describe("with progressive releases disabled", () => {
      const stateWithPendingReleaseToProgress = {
        ...initialState,
        pendingReleases: {
          1: {
            "latest/stable": {
              revision: { revision: 1, architectures: ["amd64"] },
              channel: "latest/stable",
            },
          },
        },
        releases: [
          {
            architecture: "amd64",
            track: "latest",
            risk: "stable",
            revision: { revision: 2, architectures: ["amd64"] },
          },
        ],
      };

      it("should return new releases and ignore releases to progress", () => {
        expect(
          getSeparatePendingReleases(stateWithPendingReleaseToProgress)
        ).toEqual({
          newReleases: {
            "1-latest/stable":
              stateWithPendingReleaseToProgress.pendingReleases["1"][
                "latest/stable"
              ],
          },
          newReleasesToProgress: {},
          progressiveUpdates: {},
          cancelProgressive: {},
        });
      });
    });

    describe("with progressive releases enabled", () => {
      const stateWithFlagEnabled = {
        ...initialState,
        options: {
          ...initialState.options,
          flags: {
            isProgressiveReleaseEnabled: true,
          },
        },
      };

      const stateWithPendingRelease = {
        ...stateWithFlagEnabled,
        pendingReleases: {
          1: {
            "latest/stable": {
              revision: { revision: 1, architectures: ["amd64"] },
              channel: "latest/stable",
            },
          },
        },
      };

      const stateWithPendingReleaseToProgress = {
        ...stateWithFlagEnabled,
        pendingReleases: {
          1: {
            "latest/stable": {
              revision: { revision: 1, architectures: ["amd64"] },
              channel: "latest/stable",
              progressive: {
                key: "progressive-test",
                percentage: 100,
                paused: false,
              },
              previousRevisions: [{ revision: 2 }],
            },
          },
        },
        releases: [
          {
            architecture: "amd64",
            track: "latest",
            risk: "stable",
            revision: { revision: 2, architectures: ["amd64"] },
          },
        ],
      };

      const stateWithPendingReleaseToUpdate = {
        ...stateWithFlagEnabled,
        pendingReleases: {
          1: {
            "latest/stable": {
              revision: {
                revision: 1,
                architectures: ["amd64"],
                release: {
                  progressive: {
                    key: "progressive-test",
                    percentage: 20,
                    paused: false,
                  },
                },
              },
              channel: "latest/stable",
              progressive: {
                key: "progressive-test",
                percentage: 40,
                paused: false,
              },
              previousRevisions: [
                {
                  revision: 2,
                },
              ],
            },
          },
        },
      };

      const stateWithPendingReleaseToCancel = {
        ...stateWithFlagEnabled,
        pendingReleases: {
          2: {
            "latest/stable": {
              revision: {
                revision: 2,
                architectures: ["amd64"],
              },
              channel: "latest/stable",
              replaces: {
                revision: {
                  architectures: ["amd64"],
                  revision: 1,
                },
                channel: "latest/stable",
              },
            },
          },
        },
      };

      it("should return nothing if there are no pending releases", () => {
        expect(getSeparatePendingReleases(initialState)).toEqual({
          newReleases: {},
          newReleasesToProgress: {},
          progressiveUpdates: {},
          cancelProgressive: {},
        });
      });

      it("should return new release", () => {
        expect(getSeparatePendingReleases(stateWithPendingRelease)).toEqual({
          newReleases: {
            "1-latest/stable":
              stateWithPendingRelease.pendingReleases["1"]["latest/stable"],
          },
          newReleasesToProgress: {},
          progressiveUpdates: {},
          cancelProgressive: {},
        });
      });

      it("should return new release and releases to progress", () => {
        expect(
          getSeparatePendingReleases(stateWithPendingReleaseToProgress)
        ).toEqual({
          newReleases: {},
          newReleasesToProgress: {
            "1-latest/stable":
              stateWithPendingReleaseToProgress.pendingReleases["1"][
                "latest/stable"
              ],
          },
          progressiveUpdates: {},
          cancelProgressive: {},
        });
      });

      it("should return a pending release to update", () => {
        expect(
          getSeparatePendingReleases(stateWithPendingReleaseToUpdate)
        ).toEqual({
          newReleases: {},
          newReleasesToProgress: {},
          progressiveUpdates: {
            "1-latest/stable": {
              ...stateWithPendingReleaseToUpdate.pendingReleases["1"][
                "latest/stable"
              ],
              progressive: {
                changes: [{ key: "percentage", value: 40 }],
                key: "progressive-test",
                paused: false,
                percentage: 40,
              },
            },
          },
          cancelProgressive: {},
        });
      });

      it("should return a progressive release to cancel", () => {
        expect(
          getSeparatePendingReleases(stateWithPendingReleaseToCancel)
        ).toEqual({
          newReleases: {},
          newReleasesToProgress: {},
          progressiveUpdates: {},
          cancelProgressive: {
            "1-latest/stable": {
              channel: "latest/stable",
              revision: {
                architectures: ["amd64"],
                revision: 1,
              },
            },
          },
        });
      });
    });
  });
});

describe("getPendingRelease", () => {
  const initialState = reducers(undefined, {});
  const state = {
    ...initialState,
    pendingReleases: {
      1: {
        "latest/stable": {
          channel: "latest/stable",
          revision: {
            revision: 1,
            architectures: ["amd64"],
          },
        },
        "latest/candidate": {
          channel: "latest/candidate",
          revision: {
            revision: 1,
            architectures: ["amd64"],
          },
        },
      },
    },
  };

  it("should return the correct release", () => {
    const result = getPendingRelease(state, "latest/stable", "amd64");

    expect(result).toEqual({
      ...state.pendingReleases["1"]["latest/stable"],
    });
  });

  it("should return null if no pendingRelease is found", () => {
    const result = getPendingRelease(state, "latest/stable", "arm64");

    expect(result).toBeNull();
  });
});

describe("getReleases", () => {
  it("should return nothing if there are no releases", () => {
    const result = getReleases(
      {
        releases: [],
      },
      "amd64",
      "latest/stable"
    );

    expect(result).toEqual([]);
  });

  it("should return any release that matches", () => {
    const releases = [
      {
        architecture: "amd64",
        channel: "latest/stable",
      },
      {
        architecture: "arm64",
        channel: "latest/stable",
      },
    ];
    const result = getReleases(
      {
        releases,
      },
      ["amd64"],
      "latest/stable"
    );

    expect(result).toEqual([releases[0]]);
  });
});
