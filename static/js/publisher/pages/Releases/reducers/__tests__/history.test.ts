import history from "../history";
import { CloseHistoryAction, HistoryAction, OpenHistoryAction } from "../../actions/history";
import { OPEN_HISTORY, CLOSE_HISTORY } from "../../actions/history";
import { CLOSE_CHANNEL, CloseChannelAction } from "../../actions/pendingCloses";
import { ReleasesReduxState } from "../../../../types/releaseTypes";

describe("history", () => {
  it("should return the initial state", () => {
    expect(history(undefined, {} as HistoryAction)).toEqual({
      isOpen: false,
      filters: null,
    });
  });

  describe("on OPEN_HISTORY action", () => {
    let openHistoryAction: OpenHistoryAction = {
      type: OPEN_HISTORY,
      payload: {
        filters: {
          track: "latest",
          arch: "abc42",
          risk: ""
        },
      },
    };

    it("should mark history panel open", () => {
      const result = history(
        {} as ReleasesReduxState["history"],
        openHistoryAction
      );

      expect(result.isOpen).toBe(true);
    });

    it("should set history filters", () => {
      const result = history(
        {} as ReleasesReduxState["history"],
        openHistoryAction
      );

      expect(result.filters).toEqual(openHistoryAction.payload.filters);
    });
  });

  describe("on CLOSE_HISTORY action", () => {
    let closeHistoryAction: CloseHistoryAction = {
      type: CLOSE_HISTORY,
    };

    it("should mark history panel closed", () => {
      const result = history(
        {} as ReleasesReduxState["history"],
        closeHistoryAction
      );

      expect(result.isOpen).toBe(false);
    });

    it("should remove history filters", () => {
      const result = history(
        {} as ReleasesReduxState["history"],
        closeHistoryAction
      );

      expect(result.filters).toBe(null);
    });
  });

  describe("on CLOSE_CHANNEL action", () => {
    let closeChannelAction: CloseChannelAction = {
      type: CLOSE_CHANNEL,
      payload: {
        channel: ""
      }
    };

    it("should mark history panel closed", () => {
      const result = history(
        {} as ReleasesReduxState["history"],
        closeChannelAction
      );

      expect(result.isOpen).toBe(false);
    });

    it("should remove history filters", () => {
      const result = history(
        {} as ReleasesReduxState["history"],
        closeChannelAction
      );

      expect(result.filters).toBe(null);
    });
  });
});
