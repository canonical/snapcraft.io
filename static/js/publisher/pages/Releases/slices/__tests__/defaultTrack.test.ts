import { UnknownAction, configureStore } from "@reduxjs/toolkit";
import reducer, {
  initDefaultTrack,
  setDefaultTrack,
  clearDefaultTrack,
} from "../defaultTrack";
import rootReducer from "../index";
import { Mock } from "vitest";

const makeStore = (preloadedState: Record<string, unknown> = {}) =>
  configureStore({ reducer: rootReducer, preloadedState });

describe("defaultTrack", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual("latest");
  });

  describe("on defaultTrack/initDefaultTrack action", () => {
    it("should set the default track", () => {
      const result = reducer("latest", initDefaultTrack("test"));
      expect(result).toEqual("test");
    });
  });

  describe("setDefaultTrack async thunk", () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => ({ success: true }),
      });
    });

    afterEach(() => {
      (global.fetch as Mock).mockRestore();
    });

    it("should set the default track to the current track on success", async () => {
      const store = makeStore({
        options: { snapName: "test", flags: {}, releasesReady: false },
        currentTrack: "test",
        defaultTrack: "nope",
      });

      await store.dispatch(setDefaultTrack());

      expect(store.getState().defaultTrack).toEqual("test");
    });

    it("should show a success notification on success", async () => {
      const store = makeStore({
        options: { snapName: "test", flags: {}, releasesReady: false },
        currentTrack: "test",
      });

      await store.dispatch(setDefaultTrack());

      expect(store.getState().notification.visible).toBe(true);
      expect(store.getState().notification.status).toEqual("success");
    });

    it("should close the modal on success", async () => {
      const store = makeStore({
        options: { snapName: "test", flags: {}, releasesReady: false },
        currentTrack: "test",
        modal: { visible: true },
      });

      await store.dispatch(setDefaultTrack());

      expect(store.getState().modal.visible).toBe(false);
    });
  });

  describe("clearDefaultTrack async thunk", () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => ({ success: true }),
      });
    });

    afterEach(() => {
      (global.fetch as Mock).mockRestore();
    });

    it("should set the default track to null on success", async () => {
      const store = makeStore({
        options: { snapName: "test", flags: {}, releasesReady: false },
        defaultTrack: "test",
      });

      await store.dispatch(clearDefaultTrack());

      expect(store.getState().defaultTrack).toBeNull();
    });

    it("should show a success notification on success", async () => {
      const store = makeStore({
        options: { snapName: "test", flags: {}, releasesReady: false },
      });

      await store.dispatch(clearDefaultTrack());

      expect(store.getState().notification.visible).toBe(true);
      expect(store.getState().notification.status).toEqual("success");
    });

    it("should close the modal on success", async () => {
      const store = makeStore({
        options: { snapName: "test", flags: {}, releasesReady: false },
        modal: { visible: true },
      });

      await store.dispatch(clearDefaultTrack());

      expect(store.getState().modal.visible).toBe(false);
    });
  });
});
