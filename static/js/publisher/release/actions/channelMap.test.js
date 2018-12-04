import { INIT_CHANNEL_MAP, initChannelMap } from "./channelMap";

describe("channelMap actions", () => {
  describe("initChannelMap", () => {
    let channelMap = {
      "latest/beta": {
        test: {}
      }
    };

    it("should create an action to initialize channel map", () => {
      expect(initChannelMap(channelMap).type).toBe(INIT_CHANNEL_MAP);
    });

    it("should supply a payload with channel map data", () => {
      expect(initChannelMap(channelMap).payload.channelMap).toEqual(channelMap);
    });
  });
});
