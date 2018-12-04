import channelMap from "./channelMap";
import { INIT_CHANNEL_MAP } from "../actions/channelMap";

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
});
