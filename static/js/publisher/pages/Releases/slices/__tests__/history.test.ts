import { UnknownAction } from "@reduxjs/toolkit";
import reducer, { openHistory, closeHistory, toggleHistory } from "../history";
import type { HistoryFilters, HistoryState } from "../../../../types/releaseTypes";
import type { AppDispatch, RootState } from "../../store";

describe("history", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual({
      isOpen: false,
      filters: null,
    });
  });

  describe("on history/openHistory action", () => {
    const initState: HistoryState = {
      filters: null,
      isOpen: false,
    };
    const filters: HistoryFilters = {
      track: "latest",
      arch: "abc42",
      risk: "stable",
      branch: null,
    };

    it("should mark history panel open", () => {
      const result = reducer({} as HistoryState, openHistory(filters));
      expect(result.isOpen).toBe(true);
    });

    it("should set history filters", () => {
      const result = reducer({} as HistoryState, openHistory(filters));
      expect(result.filters).toEqual(filters);
    });
  });

  describe("on history/closeHistory action", () => {
    it("should mark history panel closed", () => {
      const result = reducer({} as HistoryState, closeHistory());
      expect(result.isOpen).toBe(false);
    });

    it("should remove history filters", () => {
      const result = reducer({} as HistoryState, closeHistory());
      expect(result.filters).toBe(null);
    });
  });

  describe("toggleHistory", () => {
    const dummyFilters: HistoryFilters = {
      arch: "abc42",
      track: "latest",
      risk: "stable",
      branch: null,
    };

    describe("when history with the same filters is open", () => {
      it("should dispatch closeHistory", () => {
        const dispatch = vi.fn() as unknown as AppDispatch;
        const getState = () =>
          ({
            history: { isOpen: true, filters: { ...dummyFilters } },
          }) as unknown as RootState;

        toggleHistory(dummyFilters)(dispatch, getState);

        expect(dispatch).toHaveBeenCalledWith(closeHistory());
      });
    });

    describe("when history with empty filters is open", () => {
      it("should dispatch closeHistory", () => {
        const dispatch = vi.fn() as unknown as AppDispatch;
        const getState = () =>
          ({
            history: { isOpen: true, filters: null },
          }) as unknown as RootState;

        toggleHistory(null)(dispatch, getState);

        expect(dispatch).toHaveBeenCalledWith(closeHistory());
      });
    });

    describe("when history with different filters is open", () => {
      it("should dispatch openHistory with new filters", () => {
        const dispatch = vi.fn() as unknown as AppDispatch;
        const getState = () =>
          ({
            history: { isOpen: true, filters: { ...dummyFilters } },
          }) as unknown as RootState;

        const testFilters = { ...dummyFilters, arch: "test321" };
        toggleHistory(testFilters)(dispatch, getState);

        expect(dispatch).toHaveBeenCalledWith(openHistory(testFilters));
      });
    });

    describe("when history is closed", () => {
      it("should dispatch openHistory", () => {
        const dispatch = vi.fn() as unknown as AppDispatch;
        const getState = () =>
          ({
            history: { isOpen: false, filters: null },
          }) as unknown as RootState;

        toggleHistory(dummyFilters)(dispatch, getState);

        expect(dispatch).toHaveBeenCalledWith(openHistory(dummyFilters));
      });
    });
  });
});
