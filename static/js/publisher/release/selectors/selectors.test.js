import {
  AVAILABLE,
  AVAILABLE_REVISIONS_SELECT_ALL,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_UNRELEASED
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
  getBranches
} from "./index";

import reducers from "../reducers";

describe("getFilteredReleaseHistory", () => {
  const initialState = reducers(undefined, {});
  const stateWithRevisions = {
    ...initialState,
    revisions: {
      1: { revision: 1, version: "1" },
      2: { revision: 2, version: "2" },
      3: { revision: 3, version: "3" }
    }
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
        { risk: "test", revision: 2 }
      ]
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    expect(filteredHistory.every(r => r.revision)).toBe(true);
  });

  it("should return only releases in given architecture", () => {
    const state = {
      ...stateWithRevisions,
      releases: [
        { architecture: "test", revision: 1 },
        { architecture: "test", revision: 2 },
        { architecture: "abcd", revision: 2 },
        { architecture: "test", revision: 3 }
      ],
      history: {
        filters: {
          arch: "test"
        }
      }
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    const isEveryReleaseInTestArch = filteredHistory.every(
      r => r.release.architecture === "test"
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
        { track: "test", revision: 3 }
      ],
      history: {
        filters: {
          track: "test"
        }
      }
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    const isEveryReleaseInTestTrack = filteredHistory.every(
      r => r.release.track === "test"
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
        { risk: "test", revision: 3 }
      ],
      history: {
        filters: {
          risk: "test"
        }
      }
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    const isEveryReleaseInTestRisk = filteredHistory.every(
      r => r.release.risk === "test"
    );
    expect(isEveryReleaseInTestRisk).toBe(true);
  });

  it("should return only releases in given branch", () => {
    const state = {
      ...stateWithRevisions,
      releases: [
        { branch: "test", revision: 1 },
        { revision: 1 },
        { revision: 2 }
      ],
      history: {
        filters: {
          branch: "test"
        }
      }
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    const isEveryReleaseInTestBranch = filteredHistory.every(
      r => r.release.branch === "test"
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
        { revision: 3 }
      ]
    };

    const filteredRevisions = getFilteredReleaseHistory(state).map(
      r => r.revision
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
        test64: { revision: 2, version: "2" }
      }
    }
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
        test64: { revision: 2, version: "2" }
      }
    }
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
        test64: { revision: 2, version: "2" }
      }
    }
  };

  it("should be empty for initial state", () => {
    expect(getSelectedArchitectures(initialState)).toHaveLength(0);
  });

  it("should return list of selected revision ids", () => {
    expect(getSelectedArchitectures(stateWithSelectedRevisions)).toEqual([
      "abc42",
      "test64"
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
        armf: { revision: 3, version: "3" }
      }
    }
  };

  const stateWithConfinementDevmode = {
    ...initialState,
    channelMap: {
      "test/edge": {
        abc42: { revision: 1, version: "1" },
        test64: { revision: 2, version: "2", confinement: "devmode" },
        armf: { revision: 3, version: "3" }
      }
    }
  };

  const stateWithGradeDevel = {
    ...initialState,
    channelMap: {
      "test/edge": {
        abc42: { revision: 1, version: "1" },
        test64: { revision: 2, version: "2", grade: "devel" },
        armf: { revision: 3, version: "3" }
      }
    }
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
          test64: { revision: 1 }
        }
      },
      pendingReleases: {}
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
          test64: { revision: 1 }
        }
      },
      pendingReleases: {
        2: {
          revision: { revision: 2, architectures: ["test64"] },
          channels: ["latest/stable"]
        }
      }
    };

    it("should return channel map with pending revisions added", () => {
      expect(getPendingChannelMap(stateWithPendingReleases)).toEqual({
        ...stateWithPendingReleases.channelMap,
        "latest/stable": {
          test64: {
            ...stateWithPendingReleases.pendingReleases[2].revision
          }
        }
      });
    });
  });

  describe("when there are pending releases overriding existing releases", () => {
    const stateWithPendingReleases = {
      channelMap: {
        "test/edge": {
          test64: { revision: 1 }
        }
      },
      pendingReleases: {
        2: {
          revision: { revision: 2, architectures: ["test64"] },
          channels: ["test/edge"]
        }
      }
    };

    it("should return channel map with pending revisions", () => {
      expect(getPendingChannelMap(stateWithPendingReleases)).toEqual({
        ...stateWithPendingReleases.channelMap,
        "test/edge": {
          test64: {
            ...stateWithPendingReleases.pendingReleases[2].revision
          }
        }
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
        created_at: moreThenWeekAgo
      },
      3: {
        revision: 3,
        version: "3",
        channels: ["test/edge"],
        created_at: dayAgo
      }
    }
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
        availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_ALL
      };

      it("should return all revisions by default", () => {
        expect(getFilteredAvailableRevisions(stateWithAllSelected)).toEqual([
          stateWithAllSelected.revisions[3],
          stateWithAllSelected.revisions[2],
          stateWithAllSelected.revisions[1]
        ]);
      });
    });

    describe("when 'Unreleased' are selected in available revisions select", () => {
      const stateWithUnreleasedSelected = {
        ...stateWithRevisions,
        availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_UNRELEASED
      };

      it("should return only unreleased revisions", () => {
        expect(
          getFilteredAvailableRevisions(stateWithUnreleasedSelected)
        ).toEqual([
          stateWithUnreleasedSelected.revisions[2],
          stateWithUnreleasedSelected.revisions[1]
        ]);
      });
    });

    describe("when 'Recent' are selected in available revisions select", () => {
      const stateWithRecentSelected = {
        ...stateWithRevisions,
        availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_RECENT
      };

      it("should return unreleased revisions not older then a week", () => {
        expect(getFilteredAvailableRevisions(stateWithRecentSelected)).toEqual([
          stateWithRecentSelected.revisions[1]
        ]);
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
        channels: ["test/edge"]
      }
    }
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
      availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_ALL
    };

    it("should return selected revisions by for given architecture", () => {
      expect(
        getFilteredAvailableRevisionsForArch(stateWithAllSelected, arch)
      ).toEqual([
        stateWithAllSelected.revisions[3],
        stateWithAllSelected.revisions[1]
      ]);
    });
  });
});

describe("getArchitectures", () => {
  const initialState = reducers(undefined, {});
  const stateWithRevisions = {
    ...initialState,
    revisions: {
      1: { revision: 1, architectures: ["test64"] },
      2: { revision: 2, architectures: ["amd42", "abc64"] },
      3: { revision: 3, architectures: ["test64", "amd42"] }
    }
  };

  it("should return alphabetical list of all architectures", () => {
    expect(getArchitectures(stateWithRevisions)).toEqual([
      "abc64",
      "amd42",
      "test64"
    ]);
  });
});

describe("getTracks", () => {
  const initialState = reducers(undefined, {});
  const stateWithReleases = {
    ...initialState,
    releases: [
      { track: "latest" },
      { track: "test" },
      { track: "latest" },
      { track: "12" }
    ]
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
          test64: { revision: 1 }
        }
      },
      pendingReleases: {}
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
          test64: { revision: 1 }
        }
      },
      pendingReleases: {
        2: {
          revision: { revision: 2, architectures: ["test64"] },
          channels: ["latest/stable"]
        }
      }
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
          test64: { revision: 1 }
        }
      },
      pendingReleases: {
        2: {
          revision: { revision: 2, architectures: ["test64"] },
          channels: ["test/edge"]
        }
      }
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
        test64: { revision: 1 }
      },
      stable: {
        test64: { revision: 1 }
      },
      "test/stable": {
        test64: { revision: 2 }
      }
    };

    expect(getTrackRevisions({ channelMap }, "test")).toEqual([
      {
        test64: {
          revision: 1
        }
      },
      {
        test64: {
          revision: 2
        }
      }
    ]);
  });
});

describe("getBranches", () => {
  it("should return branches on the currentTrack, ordered by oldest first", () => {
    const today = new Date();
    const lessThan30DaysAgo = new Date(
      new Date().setDate(today.getDate() - 30)
    ).toISOString();

    const state = {
      currentTrack: "latest",
      releases: [
        {
          branch: null,
          track: "latest",
          risk: "stable",
          revision: "1",
          when: "2019-07-12T10:00:00Z"
        },
        {
          branch: "test",
          track: "latest",
          risk: "stable",
          revision: "2",
          when: lessThan30DaysAgo
        },
        {
          branch: "test2",
          track: "latest",
          risk: "stable",
          revision: "3",
          when: lessThan30DaysAgo
        },
        {
          branch: "test",
          track: "test",
          risk: "stable",
          revision: "4",
          when: "2019-07-12T09:30:00Z"
        }
      ]
    };

    expect(getBranches(state)).toEqual([
      {
        branch: "test2",
        track: "latest",
        risk: "stable",
        revision: "3",
        when: lessThan30DaysAgo
      },
      {
        branch: "test",
        track: "latest",
        risk: "stable",
        revision: "2",
        when: lessThan30DaysAgo
      }
    ]);
  });
});
