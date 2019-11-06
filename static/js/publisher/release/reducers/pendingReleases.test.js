import pendingReleases from "./pendingReleases";
import {
  RELEASE_REVISION,
  UNDO_RELEASE,
  CANCEL_PENDING_RELEASES,
  SET_PROGRESSIVE_RELEASE_PERCENTAGE,
  UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE
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
          "1": {
            [releaseRevisionAction.payload.channel]: {
              revision: releaseRevisionAction.payload.revision,
              channel: releaseRevisionAction.payload.channel
            }
          }
        });
      });
    });

    describe("when this revision is pending release to different channel", () => {
      const stateWithSamePendingRevision = {
        // same revision in different channel
        "1": {
          "other/edge": {
            revision: { revision: 1, architectures: ["abc42", "test64"] },
            channel: "other/edge"
          }
        }
      };

      it("should add new release to list of pending releases", () => {
        const result = pendingReleases(
          stateWithSamePendingRevision,
          releaseRevisionAction
        );

        expect(result[1]).toEqual({
          ...stateWithSamePendingRevision[1],
          [releaseRevisionAction.payload.channel]: {
            revision: releaseRevisionAction.payload.revision,
            channel: releaseRevisionAction.payload.channel
          }
        });
      });
    });

    describe("when other revisions have pending releases", () => {
      const stateWithPendingReleases = {
        // same architecture different channel
        "2": {
          "other/edge": {
            revision: { revision: 2, architectures: ["test64"] },
            channel: "other/edge"
          }
        },
        // same channel different architacture
        "3": {
          "test/edge": {
            revision: { revision: 3, architectures: ["armf"] },
            channel: "test/edge"
          }
        }
      };

      it("should add promoted revision to state", () => {
        const result = pendingReleases(
          stateWithPendingReleases,
          releaseRevisionAction
        );

        expect(result).toEqual({
          ...stateWithPendingReleases,
          "1": {
            [releaseRevisionAction.payload.channel]: {
              revision: releaseRevisionAction.payload.revision,
              channel: releaseRevisionAction.payload.channel
            }
          }
        });
      });
    });

    describe("when other release is pending in same arch and channel", () => {
      const stateWithPendingReleases = {
        // same architecture different channel
        "2": {
          "other/edge": {
            revision: { revision: 2, architectures: ["test64"] },
            channel: "other/edge"
          }
        },
        // same channel different architacture
        "3": {
          "test/edge": {
            revision: { revision: 3, architectures: ["armf"] },
            channel: "test/edge"
          }
        },
        // same architecture, same channel
        "4": {
          "test/edge": {
            revision: { revision: 4, architectures: ["test64"] },
            channel: "test/edge"
          }
        }
      };

      it("should add promoted revision to state", () => {
        const result = pendingReleases(
          stateWithPendingReleases,
          releaseRevisionAction
        );

        expect(result).toMatchObject({
          "1": {
            [releaseRevisionAction.payload.channel]: {
              revision: releaseRevisionAction.payload.revision,
              channel: releaseRevisionAction.payload.channel
            }
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

        expect(result).toEqual(emptyState);
      });
    });

    describe("when revision has pending release into given channel", () => {
      const stateWithRevisionInChannel = {
        "1": {
          "test/edge": {
            revision: { revision: 1, architectures: ["abc42", "test64"] },
            channel: "test/edge"
          },
          "latest/beta": {
            revision: { revision: 1, architectures: ["abc42", "test64"] },
            channel: "latest/beta"
          }
        }
      };

      it("should remove given channel from pending releases", () => {
        const result = pendingReleases(
          stateWithRevisionInChannel,
          undoReleaseAction
        );

        expect(result).toEqual({
          "1": {
            "latest/beta": stateWithRevisionInChannel["1"]["latest/beta"]
          }
        });
      });
    });

    describe("when revision has pending release only into given channel", () => {
      const stateWithRevisionInChannel = {
        "1": {
          "test/edge": {
            revision: { revision: 1, architectures: ["abc42", "test64"] },
            channel: "test/edge"
          }
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
        "1": {
          "latest/beta": {
            revision: { revision: 1, architectures: ["abc42", "test64"] },
            channel: "latest/beta"
          },
          "latest/stable": {
            revision: { revision: 1, architectures: ["abc42"] },
            channel: "latest/stable"
          }
        },
        "2": {
          "latest/stable": {
            revision: { revision: 2, architectures: ["abc42"] },
            channel: "latest/stable"
          }
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
        "1": {
          "latest/candidate": {
            revision: { revision: 1 },
            channel: "latest/candidate"
          }
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
        "1": {
          "latest/candidate": {
            revision: { revision: 1 },
            channel: "latest/candidate"
          }
        },
        "2": {
          "test/edge": {
            revision: { revision: 2 },
            channel: "test/edge"
          }
        },
        "3": {
          "test/edge": {
            revision: { revision: 3 },
            channel: "test/edge"
          }
        }
      };

      it("should remove pending releases from closed channel", () => {
        const result = pendingReleases(
          stateWithPendingReleases,
          closeChannelAction
        );

        expect(result[2]).toBeUndefined();
        expect(result[3]).toBeUndefined();
      });
    });
  });

  describe("on SET_PROGRESSIVE_RELEASE_PERCENTAGE action", () => {
    let setProgressiveAction = {
      type: SET_PROGRESSIVE_RELEASE_PERCENTAGE,
      payload: {
        key: "progressive-test",
        percentage: 50
      }
    };

    describe("when state is empty", () => {
      const emptyState = {};

      it("should not affect empty state", () => {
        const result = pendingReleases(emptyState, setProgressiveAction);

        expect(result).toEqual(emptyState);
      });
    });

    describe("when there are non-progressive pending revisions, that can't be progressive", () => {
      const stateWithPendingRevision = {
        "1": {
          "test/edge": {
            revision: { revision: 1, architectures: ["abc42"] },
            channel: "test/edge"
          }
        }
      };

      it("should not add progressive state", () => {
        const result = pendingReleases(
          stateWithPendingRevision,
          setProgressiveAction
        );

        expect(result).toEqual({
          "1": stateWithPendingRevision["1"]
        });
      });
    });

    describe("when there are non-progressive pending revisions, that can be progressive", () => {
      const stateWithPendingRevision = {
        "1": {
          "test/edge": {
            revision: { revision: 1, architectures: ["abc42", "test64"] },
            channel: "test/edge",
            canBeProgressive: true
          }
        }
      };

      it("should add progressive state to pending revision", () => {
        const result = pendingReleases(
          stateWithPendingRevision,
          setProgressiveAction
        );

        expect(result).toEqual({
          ...stateWithPendingRevision,
          "1": {
            "test/edge": {
              ...stateWithPendingRevision["1"]["test/edge"],
              progressive: {
                ...setProgressiveAction.payload,
                paused: false
              }
            }
          }
        });
      });
    });

    describe("when there are progressive pending revisions, with progressive state", () => {
      const stateWithPendingRevision = {
        "1": {
          "test/edge": {
            revision: { revision: 1, architectures: ["abc42", "test64"] },
            channel: "test/edge",
            progressive: {
              key: "progressive-test",
              percentage: 20,
              paused: false
            }
          }
        }
      };

      it("should not update progressive state", () => {
        const result = pendingReleases(
          stateWithPendingRevision,
          setProgressiveAction
        );

        expect(result).toEqual(stateWithPendingRevision);
      });
    });
  });

  describe("on UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE action", () => {
    let updateProgressiveAction = {
      type: UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE,
      payload: {
        key: "progressive-test",
        percentage: 50
      }
    };

    describe("when state is empty", () => {
      const emptyState = {};

      it("should not affect empty state", () => {
        const result = pendingReleases(emptyState, updateProgressiveAction);

        expect(result).toEqual(emptyState);
      });
    });

    describe("when pending releases exist without progressive status", () => {
      const stateWithoutProgressiveReleases = {
        "1": {
          "test/edge": {
            revision: { revision: 1, architectures: ["abc42", "test64"] },
            channel: "test/edge"
          }
        }
      };

      it("should not affect the pending releases", () => {
        const result = pendingReleases(
          stateWithoutProgressiveReleases,
          updateProgressiveAction
        );

        expect(result).toEqual(stateWithoutProgressiveReleases);
      });
    });

    describe("when there are progressive pending revisions", () => {
      const stateWithProgressiveReleases = {
        "1": {
          "test/edge": {
            revision: { revision: 1, architectures: ["abc42", "test64"] },
            channel: "test/edge",
            progressive: {
              key: "progressive-test",
              percentage: 20,
              paused: false
            }
          }
        },
        "2": {
          "test/edge": {
            revision: { revision: 2, architectures: ["abc42", "test64"] },
            channel: "test/edge",
            progressive: {
              key: "progressive-other",
              percentage: 20,
              paused: true
            },
            canBeProgressive: true
          }
        }
      };

      it("should update progressive releases with same key", () => {
        const result = pendingReleases(
          stateWithProgressiveReleases,
          updateProgressiveAction
        );

        expect(result["1"]["test/edge"]).toEqual({
          ...stateWithProgressiveReleases["1"]["test/edge"],
          progressive: {
            ...stateWithProgressiveReleases["1"]["test/edge"].progressive,
            ...updateProgressiveAction.payload
          }
        });
      });

      it("should not update progressive releases with different key", () => {
        const result = pendingReleases(
          stateWithProgressiveReleases,
          updateProgressiveAction
        );

        expect(result[2]).toEqual(stateWithProgressiveReleases[2]);
      });
    });
  });
});
