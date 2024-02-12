import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

const mockStore = configureMockStore([thunk]);

import reducers from "../reducers";

import {
  RELEASE_REVISION,
  UNDO_RELEASE,
  CANCEL_PENDING_RELEASES,
  SET_PROGRESSIVE_RELEASE_PERCENTAGE,
  UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE,
  PAUSE_PROGRESSIVE_RELEASE,
  RESUME_PROGRESSIVE_RELEASE,
  CANCEL_PROGRESSIVE_RELEASE,
  releaseRevision,
  promoteRevision,
  promoteChannel,
  undoRelease,
  cancelPendingReleases,
  setProgressiveReleasePercentage,
  updateProgressiveReleasePercentage,
  pauseProgressiveRelease,
  resumeProgressiveRelease,
  cancelProgressiveRelease,
} from "./pendingReleases";

describe("pendingReleases actions", () => {
  const revision = {
    revision: 1,
    architectures: ["test64"],
  };
  const revision2 = {
    revision: 2,
    architectures: ["test64"],
  };
  const channel = "test/edge";
  const previousRevisions = [];
  const initialState = reducers(undefined, {});
  const stateWithRevisions = {
    ...initialState,
    revisions: {
      [revision.revision]: revision,
      [revision2.revision]: revision2,
    },
  };

  beforeEach(() => {
    global.dataLayer = { push: jest.fn() };
  });

  afterEach(() => {
    global.dataLayer = undefined;
  });

  describe("releaseRevision", () => {
    const store = mockStore(stateWithRevisions);
    it("should create an action to promote revision", () => {
      expect(store.dispatch(releaseRevision(revision, channel)).type).toBe(
        RELEASE_REVISION,
      );
    });

    it("should supply a payload with revision", () => {
      const store = mockStore(stateWithRevisions);
      expect(
        store.dispatch(releaseRevision(revision, channel)).payload.revision,
      ).toEqual(revision);
    });

    it("should supply a payload with channel", () => {
      const store = mockStore(stateWithRevisions);
      expect(
        store.dispatch(releaseRevision(revision, channel)).payload.channel,
      ).toEqual(channel);
    });

    it("should supply a payload with a progressive release if there are previous releases", () => {
      const stateWithPreviousReleases = {
        ...stateWithRevisions,
        releases: [
          {
            architecture: "test64",
            channel: channel,
            revision: 2,
          },
        ],
      };
      const store = mockStore(stateWithPreviousReleases);
      expect(
        store.dispatch(releaseRevision(revision, channel)).payload.progressive,
      ).toEqual({
        percentage: 100,
        paused: false,
      });
    });

    it("should not supply a payload with a progressive release if there aren't previous releases", () => {
      const store = mockStore(stateWithRevisions);
      expect(
        store.dispatch(releaseRevision(revision, channel)).payload.progressive,
      ).toBeUndefined();
    });

    it("should supply a payload with previous revisions", () => {
      const store = mockStore(stateWithRevisions);
      expect(
        store.dispatch(releaseRevision(revision, channel)).payload
          .previousRevisions,
      ).toEqual([]);
    });

    describe("if previous revisions", () => {
      const stateWithPreviousRevisions = {
        ...initialState,
        releases: [
          {
            architecture: "test64",
            branch: null,
            channel: "test/edge",
            revision: 2,
            risk: "edge",
            track: "test",
          },
        ],
        revisions: {
          2: {
            revision: 2,
            achitectures: ["test64"],
          },
        },
      };

      it("should return previous revisions, if available", () => {
        const store = mockStore(stateWithPreviousRevisions);

        const revisionWithRelease = {
          ...revision,
          release: {
            architecture: "test64",
          },
        };

        const dispatch = store.dispatch(
          releaseRevision(revisionWithRelease, channel)(
            store.dispatch,
            store.getState,
          ),
        );

        expect(dispatch.payload.previousRevisions).toEqual([
          {
            ...stateWithPreviousRevisions.revisions["2"],
          },
        ]);
      });
    });
  });

  describe("promoteRevision", () => {
    describe("when nothing is released yet", () => {
      it("should dispatch RELEASE_REVISION action", () => {
        const store = mockStore(initialState);

        store.dispatch(promoteRevision(revision, channel));

        const actions = store.getActions();
        const expectedAction = releaseRevision(revision, channel)(
          store.dispatch,
          store.getState,
        );

        expect(actions).toContainEqual(expectedAction);
      });
    });

    describe("when revision is already released in this arch and channel", () => {
      const stateWithReleasedRevision = {
        ...initialState,
        channelMap: {
          "test/edge": {
            test64: { ...revision },
          },
        },
      };

      it("should not dispatch RELEASE_REVISION action", () => {
        const store = mockStore(stateWithReleasedRevision);

        store.dispatch(promoteRevision(revision, channel));

        const actions = store.getActions();
        expect(actions).toHaveLength(0);
      });
    });
  });

  describe("promoteChannel", () => {
    const targetChannel = "test/stable";

    describe("when nothing is released yet", () => {
      it("should not dispatch RELEASE_REVISION action", () => {
        const store = mockStore(initialState);

        store.dispatch(promoteChannel(channel, targetChannel));

        const actions = store.getActions();
        expect(actions).toHaveLength(0);
      });
    });

    describe("when revisions are in source channel", () => {
      const revision2 = { revision: 2, architectures: ["abc42"] };
      const stateWithReleasedRevisions = {
        ...initialState,
        channelMap: {
          "test/edge": {
            test64: { ...revision },
            abc42: { ...revision2 },
          },
        },
        revisions: {
          [revision.revision]: revision,
          [revision2.revision]: revision2,
        },
      };

      it("should dispatch RELEASE_REVISION for each revision to promote", () => {
        const store = mockStore(stateWithReleasedRevisions);

        store.dispatch(promoteChannel(channel, targetChannel));

        const actions = store.getActions();
        expect(actions).toContainEqual({
          type: RELEASE_REVISION,
          payload: {
            revision,
            channel: targetChannel,
            previousRevisions,
            progressive: actions.find(
              (action) =>
                action.payload.revision.revision === revision.revision &&
                action.payload.channel === targetChannel,
            ).payload.progressive,
          },
        });
        expect(actions).toContainEqual({
          type: RELEASE_REVISION,
          payload: {
            progressive: actions.find(
              (action) =>
                action.payload.revision.revision === revision2.revision &&
                action.payload.channel === targetChannel,
            ).payload.progressive,
            revision: revision2,
            channel: targetChannel,
            previousRevisions: [],
          },
        });
      });
    });
  });

  describe("undoRelease", () => {
    const store = mockStore(stateWithRevisions);
    it("should create an action to undo release of revision", () => {
      expect(store.dispatch(undoRelease(revision, channel)).type).toBe(
        UNDO_RELEASE,
      );
    });

    it("should supply a payload with revision", () => {
      expect(
        store.dispatch(undoRelease(revision, channel)).payload.revision,
      ).toEqual(revision);
    });

    it("should supply a payload with channel", () => {
      expect(
        store.dispatch(undoRelease(revision, channel)).payload.channel,
      ).toEqual(channel);
    });
  });

  describe("cancelPendingReleases", () => {
    it("should create an action to cancel pending releases", () => {
      expect(cancelPendingReleases(revision, channel).type).toBe(
        CANCEL_PENDING_RELEASES,
      );
    });
  });

  describe("setProgressiveReleasePercentage", () => {
    const percentage = 42;

    it("should create an action to set release progressive percentage", () => {
      expect(setProgressiveReleasePercentage(percentage).type).toBe(
        SET_PROGRESSIVE_RELEASE_PERCENTAGE,
      );
    });

    it("should supply a payload with percentage", () => {
      expect(
        setProgressiveReleasePercentage(percentage).payload.percentage,
      ).toEqual(percentage);
    });
  });

  describe("updateProgressiveReleasePercentage", () => {
    const percentage = 50;

    it("should create an action to update release percentage", () => {
      expect(updateProgressiveReleasePercentage(percentage).type).toBe(
        UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE,
      );
    });

    it("should supply a payload with percentage", () => {
      expect(
        updateProgressiveReleasePercentage(percentage).payload.percentage,
      ).toEqual(percentage);
    });
  });

  describe("pauseProgressiveRelease", () => {
    it("should create an action to pause a release", () => {
      expect(pauseProgressiveRelease().type).toBe(PAUSE_PROGRESSIVE_RELEASE);
    });
  });

  describe("resumeProgressiverelease", () => {
    it("should create an action to resume a release", () => {
      expect(resumeProgressiveRelease().type).toBe(RESUME_PROGRESSIVE_RELEASE);
    });
  });

  describe("cancelProgressiverelease", () => {
    const previousRevision = {
      architectures: ["amd64"],
      attributes: {},
      base: "core18",
      build_url: null,
      channels: ["latest/edge"],
      confinement: "strict",
      created_at: "2019-07-16T08:58:04Z",
      epoch: { read: null, write: null },
      grade: "stable",
      revision: 3,
      "sha3-384": "test",
      size: 4096,
      status: "Published",
      version: "1.8.0",
    };

    it("should create an action to cancel a release", () => {
      expect(cancelProgressiveRelease(previousRevision).type).toBe(
        CANCEL_PROGRESSIVE_RELEASE,
      );
    });

    it("should supply a revision in the payload", () => {
      expect(
        cancelProgressiveRelease(previousRevision).payload.previousRevision,
      ).toBe(previousRevision);
    });
  });
});
