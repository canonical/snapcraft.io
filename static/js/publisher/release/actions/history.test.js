/* global global, jest */

import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

const mockStore = configureMockStore([thunk]);

import {
  OPEN_HISTORY,
  CLOSE_HISTORY,
  openHistory,
  closeHistory,
  toggleHistory
} from "./history";

describe("history actions", () => {
  const dummyFilters = {
    arch: "abc42",
    track: "latest",
    risk: "stable",
    branch: null
  };

  beforeEach(() => {
    global.dataLayer = { push: jest.fn() };
  });

  afterEach(() => {
    global.dataLayer = undefined;
  });

  describe("openHistory", () => {
    it("should create an action to open history panel", () => {
      expect(openHistory(dummyFilters).type).toBe(OPEN_HISTORY);
    });

    it("should supply a payload with filters", () => {
      expect(openHistory(dummyFilters).payload.filters).toEqual(dummyFilters);
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

  describe("toggleHistory", () => {
    describe("when history with same filters is open", () => {
      it("should dispatch action to close history panel", () => {
        const store = mockStore({
          options: {
            snapName: "test"
          },
          history: {
            isOpen: true,
            filters: {
              ...dummyFilters
            }
          }
        });

        store.dispatch(toggleHistory(dummyFilters));

        const actions = store.getActions();
        const expectedAction = closeHistory();
        expect(actions).toEqual([expectedAction]);
      });
    });

    describe("when history with empty filters is open", () => {
      it("should dispatch action to close history panel", () => {
        const store = mockStore({
          history: {
            isOpen: true,
            filters: null
          }
        });

        store.dispatch(toggleHistory());

        const actions = store.getActions();
        const expectedAction = closeHistory();
        expect(actions).toEqual([expectedAction]);
      });
    });

    describe("when history with different filters is open", () => {
      it("should dispatch action to open history panel with new filters", () => {
        const store = mockStore({
          options: {
            snapName: "test"
          },
          history: {
            isOpen: true,
            filters: {
              ...dummyFilters
            }
          }
        });
        const testFilters = {
          ...dummyFilters,
          arch: "test321"
        };
        store.dispatch(toggleHistory(testFilters));

        const actions = store.getActions();
        const expectedAction = openHistory(testFilters);
        expect(actions).toEqual([expectedAction]);
      });
    });

    describe("when history is closed", () => {
      it("should dispatch action to open history panel", () => {
        const store = mockStore({
          options: {
            snapName: "test"
          },
          history: {
            isOpen: false,
            filters: null
          }
        });

        store.dispatch(toggleHistory(dummyFilters));

        const actions = store.getActions();
        const expectedAction = openHistory(dummyFilters);
        expect(actions).toEqual([expectedAction]);
      });
    });
  });
});
