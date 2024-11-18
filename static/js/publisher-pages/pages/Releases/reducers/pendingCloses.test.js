import pendingCloses from "./pendingCloses";

import { CLOSE_CHANNEL } from "../actions/pendingCloses";
import {
  RELEASE_REVISION,
  CANCEL_PENDING_RELEASES,
} from "../actions/pendingReleases";

describe("pendingCloses", () => {
  it("should return the initial state", () => {
    expect(pendingCloses(undefined, {})).toEqual([]);
  });

  describe("on CLOSE_CHANNEL action", () => {
    const channel = "test/edge";
    const closeChannelAction = {
      type: CLOSE_CHANNEL,
      payload: { channel },
    };

    describe("when state is empty", () => {
      const emptyState = [];

      it("should add channel to pending closes", () => {
        const result = pendingCloses(emptyState, closeChannelAction);

        expect(result).toEqual([channel]);
      });
    });

    describe("when other channels are pending close", () => {
      const stateWithOtherPendingCloses = ["latest/candidate", "test/beta"];

      it("should add channel to pending closes", () => {
        const result = pendingCloses(
          stateWithOtherPendingCloses,
          closeChannelAction,
        );

        expect(result).toEqual([...stateWithOtherPendingCloses, channel]);
      });
    });

    describe("when the same channel is already pending close", () => {
      const stateWithPendingCloses = ["test/edge", "latest/candidate"];

      it("should not add duplicated channel to pending closes", () => {
        const result = pendingCloses(
          stateWithPendingCloses,
          closeChannelAction,
        );

        expect(result).toEqual(stateWithPendingCloses);
      });
    });
  });

  describe("on RELEASE_REVISION action", () => {
    const releaseRevisionAction = {
      type: RELEASE_REVISION,
      payload: {
        revision: { revision: 1, architectures: ["test64"] },
        channel: "test/edge",
      },
    };

    describe("when there are no closed channels", () => {
      const emptyState = [];

      it("should not change the state", () => {
        const result = pendingCloses(emptyState, releaseRevisionAction);

        expect(result).toBe(emptyState);
      });
    });

    describe("when releasing to channel that is not pending close", () => {
      const stateWithOtherPendingCloses = ["latest/candidate", "test/beta"];

      it("should not change the state", () => {
        const result = pendingCloses(
          stateWithOtherPendingCloses,
          releaseRevisionAction,
        );

        expect(result).toBe(stateWithOtherPendingCloses);
      });
    });

    describe("when releasing to channel that is pending close", () => {
      const stateWithPendingCloses = ["test/edge", "latest/candidate"];

      it("should remove pending close of the channel released to", () => {
        const result = pendingCloses(
          stateWithPendingCloses,
          releaseRevisionAction,
        );

        expect(result).toEqual(["latest/candidate"]);
      });
    });
  });

  describe("on CANCEL_PENDING_RELEASES action", () => {
    let cancelPendingReleasesAction = {
      type: CANCEL_PENDING_RELEASES,
    };

    describe("when state is empty", () => {
      const emptyState = [];

      it("should not change the state", () => {
        const result = pendingCloses(emptyState, cancelPendingReleasesAction);

        expect(result).toEqual(emptyState);
      });
    });

    describe("when there are pending closes", () => {
      const stateWithPendingCloses = ["test/edge", "latest/candidate"];

      it("should remove all pending releases", () => {
        const result = pendingCloses(
          stateWithPendingCloses,
          cancelPendingReleasesAction,
        );

        expect(result).toEqual([]);
      });
    });
  });
});
