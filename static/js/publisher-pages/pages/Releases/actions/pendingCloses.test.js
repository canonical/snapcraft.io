import { CLOSE_CHANNEL, closeChannel } from "./pendingCloses";

describe("pendingCloses actions", () => {
  const channel = "test/edge";

  describe("closeChannel", () => {
    it("should create an action to close a channel", () => {
      expect(closeChannel(channel).type).toBe(CLOSE_CHANNEL);
    });

    it("should supply a payload with channel", () => {
      expect(closeChannel(channel).payload.channel).toEqual(channel);
    });
  });
});
