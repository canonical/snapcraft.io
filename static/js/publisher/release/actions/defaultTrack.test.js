/* global jest, global */

import {
  SET_DEFAULT_TRACK_ERROR,
  SET_DEFAULT_TRACK_SUCCESS,
  clearDefaultTrack,
  setDefaultTrack
} from "./defaultTrack";

describe("defaultTrack actions", () => {
  describe("SET_DEFAULT_TRACK_SUCCESS", () => {
    const fetchOptions = {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-CSRFToken": "test"
      },
      redirect: "follow",
      referrer: "no-referrer"
    };

    let dispatch;
    let getState;

    beforeEach(() => {
      const mockSuccessResponse = { success: true };
      const mockJsonPromise = Promise.resolve(mockSuccessResponse);
      const mockFetchPromise = Promise.resolve({
        json: () => mockJsonPromise
      });
      jest.spyOn(global, "fetch").mockResolvedValue(mockFetchPromise);

      dispatch = jest.fn();
      getState = jest.fn();
    });

    afterEach(() => {
      global.fetch.mockClear();
    });

    describe("setDefaultTrack", () => {
      it("should create an action that sets the default track", done => {
        const returnValue = {
          options: {
            snapName: "test",
            csrfToken: "test"
          },
          currentTrack: "test"
        };
        getState.mockReturnValue(returnValue);
        setDefaultTrack()(dispatch, getState);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
          "/test/releases/default-track",
          {
            ...fetchOptions,
            body: JSON.stringify({ default_track: "test" })
          }
        );

        setTimeout(() => {
          expect(dispatch.mock.calls.length).toEqual(1);
          expect(dispatch.mock.calls[0][0]).toEqual({
            type: SET_DEFAULT_TRACK_SUCCESS,
            payload: { track: "test" }
          });

          done();
        }, 1);
      });
    });

    describe("clearDefaultTrack", () => {
      it("should create an action that clears the default track", done => {
        const returnValue = {
          options: {
            snapName: "test",
            csrfToken: "test"
          },
          currentTrack: null
        };
        getState.mockReturnValue(returnValue);
        clearDefaultTrack()(dispatch, getState);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
          "/test/releases/default-track",
          { ...fetchOptions, body: JSON.stringify({ default_track: null }) }
        );

        setTimeout(() => {
          expect(dispatch.mock.calls.length).toEqual(1);
          expect(dispatch.mock.calls[0][0]).toEqual({
            type: SET_DEFAULT_TRACK_SUCCESS,
            payload: { track: null }
          });

          done();
        }, 1);
      });
    });
  });

  describe("SET_DEFAULT_TRACK_ERROR", () => {
    const fetchOptions = {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-CSRFToken": "test"
      },
      redirect: "follow",
      referrer: "no-referrer"
    };

    let dispatch;
    let getState;

    beforeEach(() => {
      const mockJsonPromise = Promise.reject();
      const mockFetchPromise = Promise.resolve({
        json: () => mockJsonPromise
      });
      jest.spyOn(global, "fetch").mockResolvedValue(mockFetchPromise);

      dispatch = jest.fn();
      getState = jest.fn();
    });

    afterEach(() => {
      global.fetch.mockClear();
    });

    describe("setDefaultTrack", () => {
      it("should create an action that sets the default track", done => {
        const returnValue = {
          options: {
            snapName: "test",
            csrfToken: "test"
          },
          currentTrack: "test"
        };
        getState.mockReturnValue(returnValue);
        setDefaultTrack()(dispatch, getState);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
          "/test/releases/default-track",
          {
            ...fetchOptions,
            body: JSON.stringify({ default_track: "test" })
          }
        );

        setTimeout(() => {
          expect(dispatch.mock.calls.length).toEqual(1);
          expect(dispatch.mock.calls[0][0]).toEqual({
            type: SET_DEFAULT_TRACK_ERROR
          });

          done();
        }, 1);
      });
    });

    describe("clearDefaultTrack", () => {
      it("should create an action that clears the default track", done => {
        const returnValue = {
          options: {
            snapName: "test",
            csrfToken: "test"
          },
          currentTrack: null
        };
        getState.mockReturnValue(returnValue);
        clearDefaultTrack()(dispatch, getState);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
          "/test/releases/default-track",
          { ...fetchOptions, body: JSON.stringify({ default_track: null }) }
        );

        setTimeout(() => {
          expect(dispatch.mock.calls.length).toEqual(1);
          expect(dispatch.mock.calls[0][0]).toEqual({
            type: SET_DEFAULT_TRACK_ERROR
          });

          done();
        }, 1);
      });
    });
  });
});
