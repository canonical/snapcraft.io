import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { triggerGAEvent } from "../analytics";
import { RootState } from "../store";
import rootReducer from "../slices";

let mockState: RootState = configureStore({ reducer: rootReducer }).getState();
mockState = {
  ...mockState,
  options: {
    ...mockState.options,
    snapName: "my-snap"
  }
};

const mockGetState = vi.fn(() => mockState);
const mockDispatch = vi.fn();

describe("triggerGAEvent", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.dataLayer = [];
  });

  describe("event label construction", () => {
    it("should use snapName as label when no args are passed", () => {
      const thunk = triggerGAEvent("my-action");
      thunk(mockDispatch, mockGetState);

      expect(window.dataLayer).toContainEqual(
        expect.objectContaining({
          eventAction: "my-action",
          eventLabel: "my-snap",
        })
      );
    });

    it("should prefix snapName to the arg when one arg is passed", () => {
      const thunk = triggerGAEvent("my-action", "beta");
      thunk(mockDispatch, mockGetState);

      expect(window.dataLayer).toContainEqual(
        expect.objectContaining({
          eventLabel: "my-snap/beta",
        })
      );
    });

    it("should construct from/to label when two args are passed", () => {
      const thunk = triggerGAEvent("my-action", "beta", "stable");
      thunk(mockDispatch, mockGetState);

      expect(window.dataLayer).toContainEqual(
        expect.objectContaining({
          eventLabel: expect.stringContaining("from:my-snap/beta"),
        })
      );

      expect(window.dataLayer).toContainEqual(
        expect.objectContaining({
          eventLabel: expect.stringContaining("to:my-snap/stable"),
        })
      );
    });
  });

  describe("dataLayer", () => {
    it("should push a GAEvent to dataLayer", () => {
      const thunk = triggerGAEvent("my-action");
      thunk(mockDispatch, mockGetState);

      expect(window.dataLayer).toContainEqual(
        expect.objectContaining({ event: "GAEvent" })
      );
    });

    it("should not push to dataLayer if it is not defined", () => {
      // @ts-ignore
      delete window.dataLayer;

      const thunk = triggerGAEvent("my-action");
      thunk(mockDispatch, mockGetState);

      expect(window.dataLayer).toBeUndefined();
    });
  });
});