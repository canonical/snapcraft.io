import channelMap from "./channelMap";
import {
  INIT_CHANNEL_MAP,
  SELECT_REVISION,
  RELEASE_REVISION_SUCCESS,
  CLOSE_CHANNEL_SUCCESS
} from "../actions/channelMap";
import { AVAILABLE } from "../constants";

describe("channelMap", () => {
  it("should return the initial state", () => {
    expect(channelMap(undefined, {})).toEqual({});
  });

  describe("on INIT_CHANNEL_MAP action", () => {
    let initChannelMapAction = {
      type: INIT_CHANNEL_MAP,
      payload: {
        channelMap: {
          "latest/beta": {
            test: {}
          }
        }
      }
    };

    it("should initialize data with given channel map", () => {
      const result = channelMap({}, initChannelMapAction);

      expect(result).toEqual(initChannelMapAction.payload.channelMap);
    });

    it("should replace existing channel map in state", () => {
      const initialState = {
        "test/edge": {
          abc42: {}
        }
      };

      const result = channelMap(initialState, initChannelMapAction);

      expect(result).toEqual(initChannelMapAction.payload.channelMap);
    });
  });

  describe("on SELECT_REVISION action", () => {
    const revision = {
      revision: 1,
      version: "1",
      architectures: ["abc42"]
    };

    const selectRevisionAction = {
      type: SELECT_REVISION,
      payload: { revision }
    };

    describe("when revision is not yet selected", () => {
      it("should add selected revision to AVAILABLE channel", () => {
        const result = channelMap({}, selectRevisionAction);

        expect(result[AVAILABLE]["abc42"]).toEqual(revision);
      });
    });

    describe("when revision is already selected", () => {
      const stateWithSelectedRevision = {
        [AVAILABLE]: {
          abc42: revision
        }
      };

      it("should remove selected revision from AVAILABLE channel", () => {
        const result = channelMap(
          stateWithSelectedRevision,
          selectRevisionAction
        );

        expect(result[AVAILABLE]["abc42"]).toBeUndefined();
      });
    });
  });

  describe("on RELEASE_REVISION_SUCCESS action", () => {
    const revision = {
      revision: 1,
      version: "1",
      architectures: ["abc42", "test64"]
    };

    const channel = "test/edge";

    const releaseRevisionAction = {
      type: RELEASE_REVISION_SUCCESS,
      payload: { revision, channel }
    };

    describe("when revision is not yet released", () => {
      it("should add selected revision to the channel in all architectures", () => {
        const result = channelMap({}, releaseRevisionAction);

        expect(result[channel]["abc42"]).toEqual(revision);
        expect(result[channel]["test64"]).toEqual(revision);
      });
    });

    describe("when revision is already selected", () => {
      const stateWithReleasedRevision = {
        [channel]: {
          abc42: { ...revision, isPreviouslyReleased: true }
        }
      };

      it("should not update released revision if it has the same id", () => {
        const result = channelMap(
          stateWithReleasedRevision,
          releaseRevisionAction
        );

        expect(result[channel]["abc42"].isPreviouslyReleased).toBe(true);
        expect(result[channel]["test64"].isPreviouslyReleased).toBeUndefined();
      });
    });
  });

  describe("on CLOSE_CHANNEL_SUCCESS action", () => {
    const channel = "test/edge/close";

    let closeChannelAction = {
      type: CLOSE_CHANNEL_SUCCESS,
      payload: { channel }
    };

    describe("when channel is already closed", () => {
      const emptyState = {};

      it("should not change anything", () => {
        const result = channelMap(emptyState, closeChannelAction);

        expect(result).toBe(emptyState);
      });
    });

    describe("when channel has some releases", () => {
      const revision = {
        revision: 1,
        version: "1",
        architectures: ["abc42", "test64"]
      };

      const stateWithReleasedRevision = {
        [channel]: {
          abc42: { ...revision },
          test64: { ...revision }
        }
      };

      it("should remove channel from channel map", () => {
        const result = channelMap(
          stateWithReleasedRevision,
          closeChannelAction
        );

        expect(result[channel]).toBeUndefined();
      });
    });
  });
});
