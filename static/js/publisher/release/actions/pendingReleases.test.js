import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

export const mockStore = configureMockStore([thunk]);

import reducers from "../reducers";

import {
  RELEASE_REVISION,
  UNDO_RELEASE,
  CANCEL_PENDING_RELEASES,
  releaseRevision,
  promoteRevision,
  undoRelease,
  cancelPendingReleases
} from "./pendingReleases";

describe("pendingReleases actions", () => {
  const revision = { revision: 1, architectures: ["test64"] };
  const channel = "test/edge";
  const initialState = reducers(undefined, {});

  describe("releaseRevision", () => {
    it("should create an action to promote revision", () => {
      expect(releaseRevision(revision, channel).type).toBe(RELEASE_REVISION);
    });

    it("should supply a payload with revision", () => {
      expect(releaseRevision(revision, channel).payload.revision).toEqual(
        revision
      );
    });

    it("should supply a payload with channel", () => {
      expect(releaseRevision(revision, channel).payload.channel).toEqual(
        channel
      );
    });
  });

  describe("promoteRevision", () => {
    describe("when nothing is released yet", () => {
      it("should dispatch RELEASE_REVISION action", () => {
        const store = mockStore(initialState);

        store.dispatch(promoteRevision(revision, channel));

        const actions = store.getActions();
        const expectedAction = releaseRevision(revision, channel);

        expect(actions).toEqual([expectedAction]);
      });
    });

    describe("when revision is already released in this arch and channel", () => {
      const stateWithReleasedRevsion = {
        ...initialState,
        channelMap: {
          "test/edge": {
            test64: { ...revision }
          }
        }
      };

      it("should not dispatch RELEASE_REVISION action", () => {
        const store = mockStore(stateWithReleasedRevsion);

        store.dispatch(promoteRevision(revision, channel));

        const actions = store.getActions();
        expect(actions).toHaveLength(0);
      });
    });
  });

  describe("undoRelease", () => {
    it("should create an action to undo release of revision", () => {
      expect(undoRelease(revision, channel).type).toBe(UNDO_RELEASE);
    });

    it("should supply a payload with revision", () => {
      expect(undoRelease(revision, channel).payload.revision).toEqual(revision);
    });

    it("should supply a payload with channel", () => {
      expect(undoRelease(revision, channel).payload.channel).toEqual(channel);
    });
  });

  describe("cancelPendingReleases", () => {
    it("should create an action to cancel pending releases", () => {
      expect(cancelPendingReleases(revision, channel).type).toBe(
        CANCEL_PENDING_RELEASES
      );
    });
  });
});
