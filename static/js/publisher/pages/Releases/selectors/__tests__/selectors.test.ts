import {
  AVAILABLE,
  AVAILABLE_REVISIONS_SELECT_ALL,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
} from "../../constants";
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
} from "../index";

import { store } from "../../store";
import type { ReleasesReduxState } from "../../../../types/releaseTypes";
import {
  createMockPendingChanges,
  createMockPendingReleaseItem,
  createMockRelease,
  createMockRevision
} from "../../../../test-utils";

function getInitialState() {
  return store.getState();
}

describe("getFilteredReleaseHistory", () => {
  const initialState = getInitialState();
  const stateWithRevisions: ReleasesReduxState = {
    ...initialState,
    revisions: {
      1: createMockRevision({ revision: 1, version: "1" }),
      2: createMockRevision({ revision: 2, version: "2" }),
      3: createMockRevision({ revision: 3, version: "3" }),
    },
  };

  it("should return empty list for initial state", () => {
    expect(getFilteredReleaseHistory(initialState)).toEqual([]);
  });

  it("should return only releases of revisions (ignore closing channels)", () => {
    const state: ReleasesReduxState = {
      ...stateWithRevisions,
      releases: [
        createMockRelease({ risk: "test", revision: 1 }),
        createMockRelease({ risk: "test" }),
        createMockRelease({ risk: "test", revision: 2 }),
      ],
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    // TODO
    expect(filteredHistory.every((r) => r.revision)).toBe(true);
  });

  it("should return only releases in given architecture", () => {
    const state: ReleasesReduxState = {
      ...stateWithRevisions,
      releases: [
        createMockRelease({ architecture: "test", revision: 1 }),
        createMockRelease({ architecture: "test", revision: 2 }),
        createMockRelease({ architecture: "abcd", revision: 2 }),
        createMockRelease({ architecture: "test", revision: 3 }),
      ],
      history: {
        isOpen: true,
        filters: {
          arch: "test",
          track: "",
          risk: "",
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
    const state: ReleasesReduxState = {
      ...stateWithRevisions,
      releases: [
        createMockRelease({ track: "test", revision: 1 }),
        createMockRelease({ track: "test", revision: 2 }),
        createMockRelease({ track: "abcd", revision: 2 }),
        createMockRelease({ track: "test", revision: 3 }),
      ],
      history: {
        isOpen: true,
        filters: {
          arch: "amd64",
          track: "test",
          risk: "",
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
    const state: ReleasesReduxState = {
      ...stateWithRevisions,
      releases: [
        createMockRelease({ risk: "test", revision: 1 }),
        createMockRelease({ risk: "test", revision: 2 }),
        createMockRelease({ risk: "abcd", revision: 2 }),
        createMockRelease({ risk: "test", revision: 3 }),
      ],
      history: {
        isOpen: true,
        filters: {
          arch: "amd64",
          track: "latest",
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
    const state: ReleasesReduxState = {
      ...stateWithRevisions,
      releases: [
        createMockRelease({ branch: "test", revision: 1 }),
        createMockRelease({ revision: 1 }),
        createMockRelease({ revision: 2 }),
      ],
      history: {
        isOpen: true,
        filters: {
          arch: "amd64",
          track: "latest",
          risk: "stable",
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
    const state: ReleasesReduxState = {
      ...stateWithRevisions,
      releases: [
        createMockRelease({ revision: 1 }),
        createMockRelease({ revision: 2 }),
        createMockRelease({ revision: 1 }),
        createMockRelease({ revision: 3 }),
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
  const initialState = getInitialState();

  const stateWithSelectedRevisions: ReleasesReduxState = {
    ...initialState,
    channelMap: {
      [AVAILABLE]: {
        abc42: createMockRevision({ revision: 1, version: "1" }),
        test64: createMockRevision({ revision: 2, version: "2" }),
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
  const initialState = getInitialState();

  const stateWithSelectedRevisions: ReleasesReduxState = {
    ...initialState,
    channelMap: {
      [AVAILABLE]: {
        abc42: createMockRevision({ revision: 1, version: "1" }),
        test64: createMockRevision({ revision: 2, version: "2" }),
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
  const initialState = getInitialState();

  const stateWithSelectedRevisions: ReleasesReduxState = {
    ...initialState,
    channelMap: {
      [AVAILABLE]: {
        abc42: createMockRevision({ architectures: ["abc42"], revision: 1, version: "1" }),
        test64: createMockRevision({ architectures: ["test64"], revision: 2, version: "2" }),
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
  const initialState = getInitialState();
  const stateWithReleasedRevisions: ReleasesReduxState = {
    ...initialState,
    channelMap: {
      "test/edge": {
        abc42: createMockRevision({ architectures: ["abc42"], revision: 1, version: "1" }),
        test64: createMockRevision({ architectures: ["test64"], revision: 2, version: "2" }),
        armhf: createMockRevision({ architectures: ["armhf"], revision: 3, version: "3" }),
      },
    },
  };

  const stateWithConfinementDevmode: ReleasesReduxState = {
    ...initialState,
    channelMap: {
      "test/edge": {
        abc42: createMockRevision({ architectures: ["abc42"], revision: 1, version: "1" }),
        test64: createMockRevision({
          architectures: ["test64"],
          revision: 2,
          version: "2",
          confinement: "devmode"
        }),
        armhf: createMockRevision({ architectures: ["armhf"], revision: 3, version: "3" }),
      },
    },
  };

  const stateWithGradeDevel: ReleasesReduxState = {
    ...initialState,
    channelMap: {
      "test/edge": {
        abc42: createMockRevision({ revision: 1, version: "1" }),
        test64: createMockRevision({ revision: 2, version: "2", grade: "devel" }),
        armhf: createMockRevision({ revision: 3, version: "3" }),
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
  const initialState = getInitialState();
  const stateWithPendingReleases: ReleasesReduxState = {
    ...initialState,
    channelMap: {
      "test/edge": {
        test64: createMockRevision({ revision: 1 }),
      },
    },
    pendingChanges: {
      changeOrderIndex: 1,
      pendingReleases: {
        0: {
          revision: 2,
          channels: {
            "latest/stable": {
              revision: createMockRevision({ revision: 2, architectures: ["test64"] }),
              channel: "latest/stable",
              previousReleases: [],
              progressive: {
                "current-percentage": null,
                percentage: null,
              }
            },
          },
        },
      },
      pendingCloses: {},
    },
  };

  describe("when there are no pending releases", () => {
    const stateWithNoPendingReleases: ReleasesReduxState = {
      ...initialState,
      channelMap: {
        "test/edge": {
          test64: createMockRevision({ revision: 1 }),
        },
      },
      pendingChanges: {
        changeOrderIndex: 0,
        pendingReleases: {},
        pendingCloses: {},
      },
    };

    it("should return channel map as it is", () => {
      expect(getPendingChannelMap(stateWithNoPendingReleases)).toEqual(
        stateWithNoPendingReleases.channelMap
      );
    });
  });

  describe("when there are pending releases to other channels", () => {
    it("should return channel map with pending revisions added", () => {
      expect(getPendingChannelMap(stateWithPendingReleases)).toEqual({
        ...stateWithPendingReleases.channelMap,
        "latest/stable": {
          test64: {
            ...stateWithPendingReleases
              .pendingChanges
              .pendingReleases["0"]
              .channels["latest/stable"]
              .revision,
          },
        },
      });
    });
  });

  describe("when there are pending releases overriding existing releases", () => {
    it("should return channel map with pending revisions", () => {
      const stateWithWithOverrides = {
        ...stateWithPendingReleases,
      };
      stateWithWithOverrides.pendingChanges.pendingReleases["0"].channels["test/edge"] = {
        revision: createMockRevision({ revision: 2, architectures: ["test64"] }),
        channel: "latest/stable",
        previousReleases: [],
        progressive: {
          "current-percentage": null,
          percentage: null,
        }
      };
      expect(getPendingChannelMap(stateWithWithOverrides)).toEqual({
        ...stateWithWithOverrides.channelMap,
        "test/edge": {
          test64: {
            ...stateWithWithOverrides
              .pendingChanges
              .pendingReleases["0"]
              .channels["test/edge"]
              .revision,
          },
        },
      });
    });
  });
});

describe("getFilteredAvailableRevisions", () => {
  const initialState = getInitialState();

  const dayAgo = new Date();
  dayAgo.setDate(dayAgo.getDate() - 1);

  const moreThenWeekAgo = new Date();
  moreThenWeekAgo.setDate(moreThenWeekAgo.getDate() - 8);

  const stateWithRevisions: ReleasesReduxState = {
    ...initialState,
    revisions: {
      1: createMockRevision({
        revision: 1,
        version: "1",
        created_at: dayAgo.toISOString()
      }),
      2: createMockRevision({
        revision: 2,
        version: "2",
        channels: [],
        created_at: moreThenWeekAgo.toISOString(),
      }),
      3: createMockRevision({
        revision: 3,
        version: "3",
        channels: ["test/edge"],
        created_at: dayAgo.toISOString(),
      }),
      4: createMockRevision({
        revision: 4,
        version: "4",
        channels: ["test/edge"],
        created_at: moreThenWeekAgo.toISOString(),
        attributes: { "build-request-id": "lp-1234" },
      }),
    },
  };

  describe("when there are no revisions", () => {
    it("should return empty list", () => {
      expect(getFilteredAvailableRevisions(initialState)).toEqual([]);
    });
  });

  describe("when there are some revisions in state", () => {
    describe("when 'All' is selected in available revisions select", () => {
      const stateWithAllSelected: ReleasesReduxState = {
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
      const stateWithUnreleasedSelected: ReleasesReduxState = {
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
      const stateWithRecentSelected: ReleasesReduxState = {
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
      const stateWithLaunchpadSelected: ReleasesReduxState = {
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
  const initialState = getInitialState();
  const stateWithRevisions: ReleasesReduxState = {
    ...initialState,
    revisions: {
      1: createMockRevision({ revision: 1, architectures: [arch], version: "1" }),
      2: createMockRevision({ revision: 2, architectures: ["amd42"], version: "2", channels: [] }),
      3: createMockRevision({
        revision: 3,
        architectures: [arch, "amd42"],
        version: "3",
        channels: ["test/edge"],
      }),
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
    const stateWithAllSelected: ReleasesReduxState = {
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
  const initialState = getInitialState();
  const stateWithArchitectures: ReleasesReduxState = {
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
  const initialState = getInitialState();
  const stateWithReleases: ReleasesReduxState = {
    ...initialState,
    options: {
      ...initialState.options,
      tracks: [
        {
          name: "latest",
          status: "default",
          "creation-date": null,
          "version-pattern": null,
        },
        {
          name: "test",
          status: "active",
          "creation-date": null,
          "version-pattern": null,
        },
        {
          name: "latest",
          status: "active",
          "creation-date": null,
          "version-pattern": null,
        },
        {
          name: "12",
          status: "active",
          "creation-date": null,
          "version-pattern": null,
        },
      ],
    },
  };

  it("should return list of all tracks", () => {
    expect(getTracks(stateWithReleases)).toEqual(["latest", "test", "12"]);
  });
});

describe("hasPendingRelease", () => {
  const initialState = getInitialState();

  describe("when there are no pending releases", () => {
    const stateWithNoPendingReleases: ReleasesReduxState = {
      ...initialState,
      channelMap: {
        "test/edge": {
          test64: createMockRevision({ revision: 1 }),
        },
      },
      pendingChanges: {
        changeOrderIndex: 0,
        pendingReleases: {},
        pendingCloses: {},
      },
    };

    it("should return false", () => {
      expect(
        hasPendingRelease(stateWithNoPendingReleases, "test/edge", "test64")
      ).toBe(false);
    });
  });

  describe("when there are pending releases to other channels", () => {
    const stateWithPendingReleases: ReleasesReduxState = {
      ...initialState,
      channelMap: {
        "test/edge": {
          test64: createMockRevision({ revision: 1 }),
        },
      },
      pendingChanges: createMockPendingChanges(
        [{
          revision: 2,
          channel: "latest/stable",
          pendingReleaseItem: {
            revision: createMockRevision({ revision: 2, architectures: ["test64"] }),
          },
        }],
        [],
      ),
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
    const stateWithPendingReleases: ReleasesReduxState = {
      ...initialState,
      channelMap: {
        "test/edge": {
          test64: createMockRevision({ revision: 1 }),
        },
      },
      pendingChanges: createMockPendingChanges(
        [{
          revision: 2,
          channel: "test/edge",
          pendingReleaseItem: {
            revision: createMockRevision({ revision: 2, architectures: ["test64"] }),
          },
        }],
        [],
      ),
    };

    it("should return true for channel/arch with pending release", () => {
      // TODO: investigate
      expect(
        hasPendingRelease(stateWithPendingReleases, "test/edge", "test64")
      ).toBe(true);
    });
  });
});

describe("getTrackRevisions", () => {
  const initialState = getInitialState();

  it("should return revisions in a given track", () => {
    const state: ReleasesReduxState = {
      ...initialState,
      channelMap: {
        "test/edge": {
          test64: createMockRevision({ revision: 1 }),
        },
        stable: {
          test64: createMockRevision({ revision: 1 }),
        },
        "test/stable": {
          test64: createMockRevision({ revision: 2 }),
        },
      }
    };

    expect(
      getTrackRevisions(state, "test")
    ).toMatchObject([
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
  const initialState = getInitialState();

  it("should return branches on the currentTrack, ordered by oldest first", () => {
    const today = new Date();
    const expired = new Date(
      new Date().setDate(today.getDate() - 1)
    ).toISOString();
    const notExpired = new Date(
      new Date().setDate(today.getDate() + 24)
    ).toISOString();

    const state: ReleasesReduxState = {
      ...initialState,
      currentTrack: "latest",
      releases: [
        createMockRelease({
          branch: null,
          track: "latest",
          risk: "stable",
          revision: 1,
          when: today.toISOString(),
          "expiration-date": notExpired,
        }),
        createMockRelease({
          branch: "test",
          track: "latest",
          risk: "stable",
          revision: 2,
          when: today.toISOString(),
          "expiration-date": notExpired,
        }),
        createMockRelease({
          branch: "test2",
          track: "latest",
          risk: "stable",
          revision: 3,
          when: today.toISOString(),
          "expiration-date": notExpired,
        }),
        createMockRelease({
          branch: "test",
          track: "test",
          risk: "stable",
          revision: 4,
          when: today.toISOString(),
          "expiration-date": expired,
        }),
      ],
    };

    expect(getBranches(state)).toEqual([
      {
        branch: "test2",
        track: "latest",
        risk: "stable",
        revision: 3,
        when: today.toISOString(),
        expiration: notExpired,
      },
      {
        branch: "test",
        track: "latest",
        risk: "stable",
        revision: 2,
        when: today.toISOString(),
        expiration: notExpired,
      },
    ]);
  });
});

describe("hasBuildRequestId", () => {
  const initialState = getInitialState();
  const stateWithoutBuildRequestId: ReleasesReduxState = {
    ...initialState,
    revisions: {
      1: createMockRevision({ revision: 1, version: "1" }),
      2: createMockRevision({ revision: 2, version: "2" }),
      3: createMockRevision({ revision: 3, version: "3" }),
    },
  };
  const stateWithBuildRequestId: ReleasesReduxState = {
    ...stateWithoutBuildRequestId,
    revisions: {
      ...stateWithoutBuildRequestId.revisions,
      4: createMockRevision({
        revision: 4,
        version: "4",
        attributes: { "build-request-id": "test-1234" },
      }),
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
  const initialState = getInitialState();
  const stateWithLauchpadBuilds: ReleasesReduxState = {
    ...initialState,
    revisions: {
      1: createMockRevision({ revision: 1, version: "1" }),
      2: createMockRevision({ revision: 2, version: "2" }),
      3: createMockRevision({
        revision: 3,
        version: "3",
        attributes: { "build-request-id": "lp-1234" },
      }),
      4: createMockRevision({
        revision: 4,
        version: "4",
        attributes: { "build-request-id": "lp-1234" },
      }),
    },
  };

  it("should return only revisions with Lauchpad builds", () => {
    expect(getLaunchpadRevisions(stateWithLauchpadBuilds).length).toEqual(2);
    expect(getLaunchpadRevisions(stateWithLauchpadBuilds)).not.toContain(
      stateWithLauchpadBuilds.revisions[1]
    );
    expect(getLaunchpadRevisions(stateWithLauchpadBuilds)).not.toContain(
      stateWithLauchpadBuilds.revisions[2]
    );
    expect(getLaunchpadRevisions(stateWithLauchpadBuilds)).toContain(
      stateWithLauchpadBuilds.revisions[3]
    );
    expect(getLaunchpadRevisions(stateWithLauchpadBuilds)).toContain(
      stateWithLauchpadBuilds.revisions[4]
    );
  });
});

describe("getRevisionsFromBuild", () => {
  const initialState = getInitialState();
  const stateWithLauchpadBuilds: ReleasesReduxState = {
    ...initialState,
    revisions: {
      1: createMockRevision({ revision: 1, version: "1" }),
      2: createMockRevision({ revision: 2, version: "2" }),
      3: createMockRevision({
        revision: 3,
        version: "3",
        attributes: { "build-request-id": "lp-1234" },
      }),
      4: createMockRevision({
        revision: 4,
        version: "4",
        attributes: { "build-request-id": "lp-1234" },
      }),
      5: createMockRevision({
        revision: 5,
        version: "5",
        attributes: { "build-request-id": "lp-5432" },
      }),
    },
  };

  it("should return only revisions with given build id", () => {
    const revisions = getRevisionsFromBuild(stateWithLauchpadBuilds, "lp-1234");
    expect(revisions.length).toEqual(2);
    expect(revisions).not.toContain(stateWithLauchpadBuilds.revisions[1]);
    expect(revisions).not.toContain(stateWithLauchpadBuilds.revisions[2]);
    expect(revisions).not.toContain(stateWithLauchpadBuilds.revisions[5]);
    expect(revisions).toContain(stateWithLauchpadBuilds.revisions[3]);
    expect(revisions).toContain(stateWithLauchpadBuilds.revisions[4]);
  });
});

describe("getProgressiveState", () => {
  const initialState = getInitialState();
  const stateWithProgressiveEnabled: ReleasesReduxState = {
    ...initialState,
    options: {
      ...initialState.options,
      flags: {
        isProgressiveReleaseEnabled: true,
      },
    },
    releases: [
      createMockRelease({
        architecture: "arch1",
        track: "latest",
        risk: "stable",
        revision: 1,
        isProgressive: false,
      }),
      createMockRelease({
        architecture: "arch2",
        track: "latest",
        risk: "stable",
        revision: 3,
        isProgressive: true,
      }),
      createMockRelease({
        architecture: "arch2",
        branch: null,
        track: "latest",
        risk: "stable",
        revision: 2,
        isProgressive: true,
      }),
    ],
    revisions: {
      3: createMockRevision({ revision: 3 }),
      2: createMockRevision({ revision: 2 }),
      1: createMockRevision({ revision: 1 }),
    },
  };

  const stateWithProgressiveDisabled: ReleasesReduxState = {
    ...stateWithProgressiveEnabled,
    options: {
      ...initialState.options,
      flags: {
        isProgressiveReleaseEnabled: false,
      },
    },
  };

  const stateWithProgressiveEnabledAndPendingRelease: ReleasesReduxState = {
    ...stateWithProgressiveEnabled,
    pendingChanges: createMockPendingChanges(
      [{
        revision: 3,
        channel: "latest/stable",
        pendingReleaseItem: {
          revision: createMockRevision({ revision: 3, architectures: ["arch2"] }),
          progressive: {
            "current-percentage": null,
            percentage: null,
            changes: [
              {
                key: "current-percentage",
                value: 40,
              }
            ],
          },
        }
      }],
      [],
    ),
  };

  it("should return the progressive release state of a channel and arch", () => {
    const result = getProgressiveState(
      stateWithProgressiveEnabled,
      "latest/stable",
      "arch2",
      false
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ revision: 2 });
    expect(result[1]).toBeNull();
  });

  it("should return the progressiveState and pendingProgressiveStatus", () => {
    const result = getProgressiveState(
      stateWithProgressiveEnabledAndPendingRelease,
      "latest/stable",
      "arch2",
      false
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ revision: 2 });
    expect(result[1]).toMatchObject(
      {
        changes: [{ key: "current-percentage", value: 40 }],
      },
    );
  });

  it("should return array of nulls if progressive release flag is disabled", () => {
    expect(
      getProgressiveState(
        stateWithProgressiveDisabled,
        "latest/stable",
        "arch2",
        false
      )
    ).toEqual([null, null]);
  });
});

describe("isProgressiveReleaseEnabled", () => {
  const initialState = getInitialState();
  const stateWithProgressiveEnabled: ReleasesReduxState = {
    ...initialState,
    options: {
      ...initialState.options,
      flags: {
        isProgressiveReleaseEnabled: true,
      },
    },
  };

  const stateWithProgressiveDisabled: ReleasesReduxState = {
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
  const initialState = getInitialState();
  const stateWithARelease: ReleasesReduxState = {
    ...initialState,
    releases: [
      createMockRelease(
        { architecture: "arm64", risk: "beta", track: "latest", revision: 1 },
      ),
    ],
  };
  const stateWithAClose: ReleasesReduxState = {
    ...initialState,
    releases: [
      createMockRelease(
        { architecture: "arm64", risk: "beta", track: "latest", revision: null },
      ),
    ],
  };
  const stateWithMultipleArchAndChannels: ReleasesReduxState = {
    ...initialState,
    releases: [
      createMockRelease(
        { architecture: "amd64", risk: "stable", track: "latest", revision: 1 },
      ),
      createMockRelease({
        architecture: "arm64",
        risk: "candidate",
        track: "latest",
        revision: 2,
      }),
      createMockRelease({
        architecture: "arm64",
        risk: "stable",
        track: "latest",
        revision: null,
      }),
      createMockRelease(
        { architecture: "arm64", risk: "beta", track: "latest", revision: 3 },
      ),
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
    const initialState = getInitialState();

    describe("with progressive releases disabled", () => {
      const stateWithPendingReleaseToProgress: ReleasesReduxState = {
        ...initialState,
        pendingChanges: createMockPendingChanges(
          [{
            revision: 1,
            channel: "latest/stable",
            pendingReleaseItem: {
              revision: createMockRevision({ revision: 1, architectures: ["amd64"] }),
            }
          }],
          [],
        ),
        releases: [
          createMockRelease({
            architecture: "amd64",
            track: "latest",
            risk: "stable",
            revision: 2,
          }),
        ],
      };

      it("should return new releases and ignore releases to progress", () => {
        expect(
          getSeparatePendingReleases(stateWithPendingReleaseToProgress)
        ).toEqual({
          newReleases: {
            "1-latest/stable":
              stateWithPendingReleaseToProgress
                .pendingChanges
                .pendingReleases["0"]
                .channels["latest/stable"],
          },
          newReleasesToProgress: {},
          cancelProgressive: {},
        });
      });
    });

    describe("with progressive releases enabled", () => {
      const stateWithFlagEnabled: ReleasesReduxState = {
        ...initialState,
        options: {
          ...initialState.options,
          flags: {
            isProgressiveReleaseEnabled: true,
          },
        },
      };

      const stateWithPendingRelease: ReleasesReduxState = {
        ...stateWithFlagEnabled,
        pendingChanges: createMockPendingChanges(
          [{
            revision: 1,
            channel: "latest/stable",
            pendingReleaseItem: {
              revision: createMockRevision({ revision: 1, architectures: ["amd64"] }),
            },
          }],
          [],
        ),
      };

      const stateWithPendingReleaseToProgress: ReleasesReduxState = {
        ...stateWithFlagEnabled,
        pendingChanges: createMockPendingChanges(
          [{
            revision: 1,
            channel: "latest/stable",
            pendingReleaseItem: {
              revision: createMockRevision({ revision: 1, architectures: ["amd64"] }),
              progressive: {
                "current-percentage": null,
                percentage: null,
                changes: [{
                  key: "percentage",
                  value: 100,
                }]
              },
              previousReleases: [
                createMockRevision({ revision: 2 }),
              ],
            }
          }],
          [],
        ),
        releases: [
          createMockRelease({
            architecture: "amd64",
            track: "latest",
            risk: "stable",
            revision: 2,
          }),
        ],
      };

      const stateWithPendingReleaseToCancel: ReleasesReduxState = {
        ...stateWithFlagEnabled,
        pendingChanges: createMockPendingChanges(
          [{
            revision: 2,
            channel: "latest/stable",
            pendingReleaseItem: {
              revision: createMockRevision({
                revision: 2,
                architectures: ["amd64"],
              }),
              replaces: createMockPendingReleaseItem({
                revision: {
                  architectures: ["amd64"],
                  revision: 1,
                },
                channel: "latest/stable",
              }),
            },
          }],
          [],
        ),
      };

      it("should return nothing if there are no pending releases", () => {
        expect(getSeparatePendingReleases(initialState)).toEqual({
          newReleases: {},
          newReleasesToProgress: {},
          cancelProgressive: {},
        });
      });

      it("should return new release", () => {
        expect(getSeparatePendingReleases(stateWithPendingRelease)).toEqual({
          newReleases: {
            "1-latest/stable":
              stateWithPendingRelease
                .pendingChanges
                .pendingReleases["0"]
                .channels["latest/stable"],
          },
          newReleasesToProgress: {},
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
              stateWithPendingReleaseToProgress
                .pendingChanges
                .pendingReleases["0"]
                .channels["latest/stable"],
          },
          cancelProgressive: {},
        });
      });

      it("should return a progressive release to cancel", () => {
        expect(
          getSeparatePendingReleases(stateWithPendingReleaseToCancel)
        ).toMatchObject({
          newReleases: {},
          newReleasesToProgress: {},
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
  const initialState = getInitialState();
  const state: ReleasesReduxState = {
    ...initialState,
    pendingChanges: createMockPendingChanges(
      [
        {
          revision: 1,
          channel: "latest/stable",
          pendingReleaseItem: {
            revision: {
              revision: 1,
              architectures: ["amd64"],
            },
          },
        },
        {
          revision: 1,
          channel: "latest/candidate",
          pendingReleaseItem: {
            revision: {
              revision: 1,
              architectures: ["amd64"],
            },
          },
        }
      ],
      [],
    ),
  };

  it("should return the correct release", () => {
    const result = getPendingRelease(state, "latest/stable", "amd64");

    expect(result).toEqual({
      ...state.pendingChanges.pendingReleases["0"].channels["latest/stable"],
    });
  });

  it("should return null if no pendingRelease is found", () => {
    const result = getPendingRelease(state, "latest/stable", "arm64");

    expect(result).toBeNull();
  });
});

describe("getReleases", () => {
  const initialState = getInitialState();

  it("should return nothing if there are no releases", () => {
    const result = getReleases(
      {
        ...initialState,
        releases: [],
      } as ReleasesReduxState,
      "amd64",
      "latest/stable"
    );

    expect(result).toEqual([]);
  });

  it("should return any release that matches", () => {
    const releases = [
      createMockRelease({
        architecture: "amd64",
        channel: "latest/stable",
      }),
      createMockRelease({
        architecture: "arm64",
        channel: "latest/stable",
      }),
    ];
    const result = getReleases(
      {
        ...initialState,
        releases,
      } as ReleasesReduxState,
      ["amd64"],
      "latest/stable"
    );

    expect(result).toEqual([releases[0]]);
  });
});
