import history from "./history";
import { OPEN_HISTORY, CLOSE_HISTORY } from "../actions/history";

describe("history", () => {
  it("should return the initial state", () => {
    expect(history(undefined, {})).toEqual({
      isOpen: false,
      filters: null
    });
  });

  describe("on OPEN_HISTORY action", () => {
    let openHistoryAction = {
      type: OPEN_HISTORY,
      payload: {
        filters: {
          track: "latest",
          arch: "abc42"
        }
      }
    };

    it("should mark history panel open", () => {
      const result = history({}, openHistoryAction);

      expect(result.isOpen).toBe(true);
    });

    it("should set history filters", () => {
      const result = history({}, openHistoryAction);

      expect(result.filters).toEqual(openHistoryAction.payload.filters);
    });
  });

  describe("on CLOSE_HISTORY action", () => {
    let closeHistoryAction = {
      type: CLOSE_HISTORY
    };

    it("should mark history panel closed", () => {
      const result = history({}, closeHistoryAction);

      expect(result.isOpen).toBe(false);
    });

    it("should remove history filters", () => {
      const result = history({}, closeHistoryAction);

      expect(result.filters).toBe(null);
    });
  });
});
