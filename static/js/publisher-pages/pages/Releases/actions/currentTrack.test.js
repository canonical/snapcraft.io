import { SET_CURRENT_TRACK, setCurrentTrack } from "./currentTrack";

describe("setCurrentTrack actions", () => {
  const track = "test";

  describe("SET_CURRENT_TRACK", () => {
    it("should create an action to set track", () => {
      expect(setCurrentTrack(track).type).toBe(SET_CURRENT_TRACK);
    });

    it("should supply a payload with track name", () => {
      expect(setCurrentTrack(track).payload.track).toEqual(track);
    });
  });
});
