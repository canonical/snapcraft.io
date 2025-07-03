import configureStore from "redux-mock-store";
import thunk from "redux-thunk";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

import {
  SET_DEFAULT_TRACK_SUCCESS,
  clearDefaultTrack,
  setDefaultTrack,
} from "../defaultTrack";
import { CLOSE_MODAL } from "../modal";

describe("defaultTrack actions", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => ({
        success: true,
      }),
    });
  });

  afterEach(() => {
    global.fetch.mockRestore();
  });

  describe("SET_DEFAULT_TRACK_SUCCESS", () => {
    describe("setDefaultTrack", () => {
      it("should create an action that sets the default track", () => {
        const store = mockStore({
          options: {
            snapName: "test",
            csrfToken: "test",
          },
          currentTrack: "test",
          defaultTrack: "nope",
        });

        return store.dispatch(setDefaultTrack()).then(() => {
          const actions = store.getActions();
          expect(actions[0]).toEqual({
            type: SET_DEFAULT_TRACK_SUCCESS,
            payload: "test",
          });
          expect(actions[1]).toEqual({
            type: "SHOW_NOTIFICATION",
            payload: {
              status: "success",
              appearance: "positive",
              content: expect.stringContaining(
                "The default track for test has been set to test.",
              ),
              canDismiss: true,
            },
          });
          expect(actions[2]).toEqual({
            type: CLOSE_MODAL,
          });
        });
      });
    });

    describe("clearDefaultTrack", () => {
      it("should create an action that clears the default track", () => {
        const store = mockStore({
          options: {
            snapName: "test",
            csrfToken: "test",
          },
        });

        return store.dispatch(clearDefaultTrack()).then(() => {
          const actions = store.getActions();
          expect(actions[0]).toEqual({
            type: SET_DEFAULT_TRACK_SUCCESS,
            payload: null,
          });
          expect(actions[1]).toEqual({
            type: "CLOSE_MODAL",
          });
          expect(actions[2]).toEqual({
            type: "SHOW_NOTIFICATION",
            payload: {
              status: "success",
              appearance: "positive",
              content: expect.stringContaining(
                "The default track for test has been removed. All new installations without a specified track (e.g. `sudo snap install test`) will receive updates from latest track.",
              ),
              canDismiss: true,
            },
          });
        });
      });
    });
  });
});
