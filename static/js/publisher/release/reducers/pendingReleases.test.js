import pendingReleases from "./pendingReleases";
import {
  RELEASE_REVISION,
  UNDO_RELEASE,
  CANCEL_PENDING_RELEASES
} from "../actions/pendingReleases";
import { CLOSE_CHANNEL } from "../actions/pendingCloses";

describe("pendingReleases", () => {
  it("should return the initial state", () => {
    expect(pendingReleases(undefined, {})).toEqual({});
  });

  describe("on RELEASE_REVISION action", () => {
    let releaseRevisionAction = {
      type: RELEASE_REVISION,
      payload: {
        revision: { revision: 1, architectures: ["abc42", "test64"] },
        channel: "test/edge"
      }
    };

    describe("when state is empty", () => {
      const emptyState = {};

      it("should add promoted revision to state", () => {
        const result = pendingReleases(emptyState, releaseRevisionAction);

        expect(result).toEqual({
          1: {
            revision: releaseRevisionAction.payload.revision,
            channels: [releaseRevisionAction.payload.channel]
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
          releaseRevisionAction
        );

        expect(result).toEqual({
          ...stateWithSamePendingRevision,
          1: {
            revision: releaseRevisionAction.payload.revision,
            channels: [
              ...stateWithSamePendingRevision[1].channels,
              releaseRevisionAction.payload.channel
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
          releaseRevisionAction
        );

        expect(result).toEqual({
          ...stateWithPendingReleases,
          1: {
            revision: releaseRevisionAction.payload.revision,
            channels: [releaseRevisionAction.payload.channel]
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
          releaseRevisionAction
        );

        expect(result).toMatchObject({
          1: {
            revision: releaseRevisionAction.payload.revision,
            channels: [releaseRevisionAction.payload.channel]
          }
        });
      });

      it("should remove pending releases from same arch and channel", () => {
        const result = pendingReleases(
          stateWithPendingReleases,
          releaseRevisionAction
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

  describe("on CLOSE_CHANNEL action", () => {
    const channel = "test/edge";
    const closeChannelAction = {
      type: CLOSE_CHANNEL,
      payload: { channel }
    };

    describe("when state is empty", () => {
      const emptyState = {};

      it("should not change the state", () => {
        const result = pendingReleases(emptyState, closeChannelAction);

        expect(result).toBe(emptyState);
      });
    });

    describe("when there are pending releases to other channels", () => {
      const stateWithOtherPendingReleases = {
        1: {
          revision: { revision: 1 },
          channels: ["latest/candidate"]
        }
      };

      it("should not change the state", () => {
        const result = pendingReleases(
          stateWithOtherPendingReleases,
          closeChannelAction
        );

        expect(result).toBe(stateWithOtherPendingReleases);
      });
    });

    describe("when there are pending releases to same channel", () => {
      const stateWithPendingReleases = {
        1: {
          revision: { revision: 1 },
          channels: ["latest/candidate"]
        },
        2: {
          revision: { revision: 2 },
          channels: ["test/edge", "latest/candidate"]
        },
        3: {
          revision: { revision: 3 },
          channels: ["test/edge"]
        }
      };

      it("should remove closed channel from pending releases", () => {
        const result = pendingReleases(
          stateWithPendingReleases,
          closeChannelAction
        );

        expect(result[2].channels).not.toContain(channel);
      });

      it("should remove pending releases to closed channel", () => {
        const result = pendingReleases(
          stateWithPendingReleases,
          closeChannelAction
        );

        expect(result[3]).toBeUndefined();
      });
    });
  });
});
