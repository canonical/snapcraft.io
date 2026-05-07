import { UnknownAction } from "@reduxjs/toolkit";
import reducer, {
  initChannelMap,
  selectRevision,
  toggleRevision,
  clearSelectedRevisions,
  releaseRevisionSuccess,
  closeChannelSuccess,
} from "../channelMap";
import { AVAILABLE } from "../../constants";
import type { ChannelMapState, Revision } from "../../../../types/releaseTypes";

describe("channelMap", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual({});
  });

  describe("on channelMap/initChannelMap action", () => {
    const channelMapData = {
      "latest/beta": { test: {} },
    } as unknown as ChannelMapState;

    it("should initialize data with given channel map", () => {
      const result = reducer({}, initChannelMap(channelMapData));
      expect(result).toEqual(channelMapData);
    });

    it("should replace existing channel map in state", () => {
      const initialState = {
        "test/edge": { abc42: {} as Revision },
      };
      const result = reducer(initialState, initChannelMap(channelMapData));
      expect(result).toEqual(channelMapData);
    });
  });

  describe("on channelMap/selectRevision action", () => {
    const revision = {
      revision: 1,
      version: "1",
      architectures: ["abc42"],
    } as unknown as Revision;

    describe("when revision is not yet selected", () => {
      it("should add selected revision to AVAILABLE channel", () => {
        const result = reducer({}, selectRevision(revision));
        expect(result[AVAILABLE]["abc42"]).toEqual(revision);
      });
    });

    describe("when revision is already selected", () => {
      const stateWithSelectedRevision = {
        [AVAILABLE]: { abc42: { revision: 2 } as Revision },
      };

      it("should update selected revision", () => {
        const result = reducer(stateWithSelectedRevision, selectRevision(revision));
        expect(result[AVAILABLE]["abc42"]).toEqual(revision);
      });
    });
  });

  describe("on channelMap/toggleRevision action", () => {
    const revision = {
      revision: 1,
      version: "1",
      architectures: ["abc42"],
    } as unknown as Revision;

    describe("when revision is not yet selected", () => {
      it("should add selected revision to AVAILABLE channel", () => {
        const result = reducer({}, toggleRevision(revision));
        expect(result[AVAILABLE]["abc42"]).toEqual(revision);
      });
    });

    describe("when revision is already selected", () => {
      const stateWithSelectedRevision = {
        [AVAILABLE]: { abc42: revision },
      };

      it("should remove selected revision from AVAILABLE channel", () => {
        const result = reducer(stateWithSelectedRevision, toggleRevision(revision));
        expect(result[AVAILABLE]["abc42"]).toBeUndefined();
      });
    });
  });

  describe("on channelMap/clearSelectedRevisions action", () => {
    const revision = {
      revision: 1,
      version: "1",
      architectures: ["abc42"],
    } as unknown as Revision;

    const stateWithSelectedRevision = {
      [AVAILABLE]: { abc42: revision },
    };

    it("should remove all selected revisions from AVAILABLE channel", () => {
      const result = reducer(stateWithSelectedRevision, clearSelectedRevisions());
      expect(result[AVAILABLE]).toEqual({});
    });
  });

  describe("on channelMap/releaseRevisionSuccess action", () => {
    const revision = {
      revision: 1,
      version: "1",
      architectures: ["abc42", "test64"],
    } as unknown as Revision;
    const channel = "test/edge";

    describe("when revision is not yet released", () => {
      it("should add revision to the channel for all architectures", () => {
        const result = reducer({}, releaseRevisionSuccess({ revision, channel }));
        expect(result[channel]["abc42"]).toEqual(revision);
        expect(result[channel]["test64"]).toEqual(revision);
      });
    });
  });

  describe("on channelMap/closeChannelSuccess action", () => {
    const channel = "test/edge/close";

    describe("when channel is already closed", () => {
      it("should not change anything", () => {
        const emptyState = {};
        const result = reducer(emptyState, closeChannelSuccess(channel));
        expect(result).toBe(emptyState);
      });
    });

    describe("when channel has some releases", () => {
      const revision = {
        revision: 1,
        version: "1",
        architectures: ["abc42", "test64"],
      } as unknown as Revision;

      const stateWithReleasedRevision = {
        [channel]: {
          abc42: { ...revision },
          test64: { ...revision },
        },
      } as unknown as ChannelMapState;

      it("should remove channel from channel map", () => {
        const result = reducer(stateWithReleasedRevision, closeChannelSuccess(channel));
        expect(result[channel]).toBeUndefined();
      });
    });
  });
});
