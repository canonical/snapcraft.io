import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

const mockStore = configureMockStore([thunk]);

import {
  OPEN_BRANCHES,
  CLOSE_BRANCHES,
  openBranches,
  closeBranches,
  toggleBranches
} from "./branches";

describe("branches actions", () => {
  describe("openBranches", () => {
    it("should create an OPEN_BRANCHES action to update the branches list", () => {
      const action = openBranches("test");
      expect(action.type).toBe(OPEN_BRANCHES);
      expect(action.payload).toEqual("test");
    });
  });
  describe("closeBranches", () => {
    it("should create a CLOSE_BRANCHES action to update the branches list", () => {
      const action = closeBranches("test");
      expect(action.type).toBe(CLOSE_BRANCHES);
      expect(action.payload).toEqual("test");
    });
  });
  describe("toggleBranches", () => {
    it("should create an OPEN_BRANCHES action if the branch isn't in the branches list", () => {
      const store = mockStore({
        branches: []
      });

      store.dispatch(toggleBranches("test"));

      const actions = store.getActions();
      const expectedAction = openBranches("test");
      expect(actions).toEqual([expectedAction]);
    });
    it("should create a CLOSE_BRANCHES action if the branch is in the branches list", () => {
      const store = mockStore({
        branches: ["test"]
      });

      store.dispatch(toggleBranches("test"));

      const actions = store.getActions();
      const expectedAction = closeBranches("test");
      expect(actions).toEqual([expectedAction]);
    });
  });
});
