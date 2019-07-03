/* global global, jest */

import configureStore from "redux-mock-store";
import thunk from "redux-thunk";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

import {
  SET_DEFAULT_TRACK_SUCCESS,
  clearDefaultTrack,
  setDefaultTrack
} from "./defaultTrack";

describe("defaultTrack actions", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => ({
        success: true
      })
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
            csrfToken: "test"
          },
          currentTrack: "test",
          defaultTrack: "nope"
        });

        return store.dispatch(setDefaultTrack()).then(() => {
          const actions = store.getActions();
          expect(actions[0]).toEqual({
            type: SET_DEFAULT_TRACK_SUCCESS,
            payload: "test"
          });
        });
      });
    });

    describe("clearDefaultTrack", () => {
      it("should create an action that clears the default track", () => {
        const store = mockStore({
          options: {
            snapName: "test",
            csrfToken: "test"
          }
        });

        return store.dispatch(clearDefaultTrack()).then(() => {
          const actions = store.getActions();
          expect(actions[0]).toEqual({
            type: SET_DEFAULT_TRACK_SUCCESS,
            payload: null
          });
        });
      });
    });
  });
});
