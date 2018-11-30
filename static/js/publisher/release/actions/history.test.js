import {
  OPEN_HISTORY,
  CLOSE_HISTORY,
  openHistory,
  closeHistory
} from "./history";

describe("history actions", () => {
  describe("openHistory", () => {
    let filters = {
      track: "latest",
      arch: "abc42"
    };

    it("should create an action to open history panel", () => {
      expect(openHistory(filters).type).toBe(OPEN_HISTORY);
    });

    it("should supply a payload with filters", () => {
      expect(openHistory(filters).payload.filters).toEqual(filters);
    });
  });

  describe("closeHistory", () => {
    it("should create an action to close history panel", () => {
      expect(closeHistory().type).toBe(CLOSE_HISTORY);
    });

    it("should not supply any payload", () => {
      expect(closeHistory().payload).toBeUndefined();
    });
  });
});
