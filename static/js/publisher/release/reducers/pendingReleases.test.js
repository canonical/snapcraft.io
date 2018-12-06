import pendingReleases from "./pendingReleases";
import {
  PROMOTE_REVISION,
  UNDO_RELEASE,
  CANCEL_PENDING_RELEASES
} from "../actions/pendingReleases";

describe("pendingReleases", () => {
  it("should return the initial state", () => {
    expect(pendingReleases(undefined, {})).toEqual({});
  });

  describe("on PROMOTE_REVISION action", () => {
    let promoteRevisionAction = {
      type: PROMOTE_REVISION,
      payload: {
        revision: { revision: 1, architectures: ["abc42", "test64"] },
        channel: "test/edge"
      }
    };

    describe("when state is empty", () => {
      const emptyState = {};

      it("should add promoted revision to state", () => {
        const result = pendingReleases(emptyState, promoteRevisionAction);

        expect(result).toEqual({
          1: {
            revision: promoteRevisionAction.payload.revision,
            channels: [promoteRevisionAction.payload.channel]
          }
        });
      });
    });

    describe("when this revision is pending release to different channel", () => {
      const stateWithSamePendingRevision = {
        // same revision in different channel
        1: {
          revision: { revision: 1, architectures: ["abc42", "test64"] },
          channels: ["other/edge"]
        }
      };

      it("should add new channel to list of pending releases", () => {
        const result = pendingReleases(
          stateWithSamePendingRevision,
          promoteRevisionAction
        );

        expect(result).toEqual({
          ...stateWithSamePendingRevision,
          1: {
            revision: promoteRevisionAction.payload.revision,
            channels: [
              ...stateWithSamePendingRevision[1].channels,
              promoteRevisionAction.payload.channel
            ]
          }
        });
      });
    });

    describe("when other revisions have pending releases", () => {
      const stateWithPendingReleases = {
        // same architecture different channel
        2: {
          revision: { revision: 2, architectures: ["test64"] },
          channels: ["other/edge"]
        },
        // same channel different architacture
        3: {
          revision: { revision: 3, architectures: ["armf"] },
          channels: ["test/edge"]
        }
      };

      it("should add promoted revision to state", () => {
        const result = pendingReleases(
          stateWithPendingReleases,
          promoteRevisionAction
        );

        expect(result).toEqual({
          ...stateWithPendingReleases,
          1: {
            revision: promoteRevisionAction.payload.revision,
            channels: [promoteRevisionAction.payload.channel]
          }
        });
      });
    });

    describe("when other release is pending in same arch and channel", () => {
      const stateWithPendingReleases = {
        // same architecture different channel
        2: {
          revision: { revision: 2, architectures: ["test64"] },
          channels: ["other/edge"]
        },
        // same channel different architacture
        3: {
          revision: { revision: 3, architectures: ["armf"] },
          channels: ["test/edge"]
        },
        // same architecture, same channel
        4: {
          revision: { revision: 3, architectures: ["test64"] },
          channels: ["test/edge"]
        }
      };

      it("should add promoted revision to state", () => {
        const result = pendingReleases(
          stateWithPendingReleases,
          promoteRevisionAction
        );

        expect(result).toMatchObject({
          1: {
            revision: promoteRevisionAction.payload.revision,
            channels: [promoteRevisionAction.payload.channel]
          }
        });
      });

      it("should remove pending releases from same arch and channel", () => {
        const result = pendingReleases(
          stateWithPendingReleases,
          promoteRevisionAction
        );

        expect(Object.keys(result)).not.toContain(4);
      });
    });
  });

  describe("on UNDO_RELEASE action", () => {
    const undoReleaseAction = {
      type: UNDO_RELEASE,
      payload: {
        revision: { revision: 1, architectures: ["abc42", "test64"] },
        channel: "test/edge"
      }
    };

    describe("when state is empty", () => {
      const emptyState = {};

      it("should not change state if revision is not pending", () => {
        const result = pendingReleases(emptyState, undoReleaseAction);

        expect(result).toBe(emptyState);
      });
    });

    describe("when revision has pending releases into different channels", () => {
      const stateWithRevisionInOtherChannel = {
        1: {
          revision: { revision: 1, architectures: ["abc42", "test64"] },
          channels: ["latest/beta", "other/stable"]
        }
      };

      it("should not change the state", () => {
        const result = pendingReleases(
          stateWithRevisionInOtherChannel,
          undoReleaseAction
        );

        expect(result).toBe(stateWithRevisionInOtherChannel);
      });
    });

    describe("when revision has pending release into given channel", () => {
      const stateWithRevisionInChannel = {
        1: {
          revision: { revision: 1, architectures: ["abc42", "test64"] },
          channels: ["latest/beta", "test/edge", "other/stable"]
        }
      };

      it("should remove given channel from pending releases", () => {
        const result = pendingReleases(
          stateWithRevisionInChannel,
          undoReleaseAction
        );

        expect(result).toEqual({
          1: {
            ...stateWithRevisionInChannel[1],
            channels: ["latest/beta", "other/stable"]
          }
        });
      });
    });

    describe("when revision has pending release only into given channel", () => {
      const stateWithRevisionInChannel = {
        1: {
          revision: { revision: 1, architectures: ["abc42", "test64"] },
          channels: ["test/edge"]
        }
      };

      it("should remove revision from the state", () => {
        const result = pendingReleases(
          stateWithRevisionInChannel,
          undoReleaseAction
        );

        expect(result).toEqual({});
      });
    });
  });

  describe("on CANCEL_PENDING_RELEASES action", () => {
    let cancelPendingReleasesAction = {
      type: CANCEL_PENDING_RELEASES
    };

    describe("when state is empty", () => {
      const emptyState = {};

      it("should not change the state", () => {
        const result = pendingReleases(emptyState, cancelPendingReleasesAction);

        expect(result).toEqual(emptyState);
      });
    });

    describe("when there are pending releases", () => {
      const stateWithPendingReleases = {
        1: {
          revision: { revision: 1, architectures: ["abc42", "test64"] },
          channels: ["latest/beta", "other/stable"]
        }
      };

      it("should remove all pending releases", () => {
        const result = pendingReleases(
          stateWithPendingReleases,
          cancelPendingReleasesAction
        );

        expect(result).toEqual({});
      });
    });
  });
});
