import { UNASSIGNED } from "../constants";
import {
  getFilteredReleaseHistory,
  getSelectedRevisions,
  getSelectedArchitectures,
  hasDevmodeRevisions
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

  it("should return ignore any releases to branches", () => {
    const state = {
      ...stateWithRevisions,
      releases: [
        { branch: "test", revision: 1 },
        { revision: 1 },
        { revision: 2 }
      ]
    };

    const filteredHistory = getFilteredReleaseHistory(state);
    expect(filteredHistory.some(r => r.release.branch)).toBe(false);
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
      [UNASSIGNED]: {
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

describe("getSelectedArchitectures", () => {
  const initialState = reducers(undefined, {});

  const stateWithSelectedRevisions = {
    ...initialState,
    channelMap: {
      [UNASSIGNED]: {
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
