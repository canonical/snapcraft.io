import configureMockStore from "redux-mock-store";
import { thunk } from "redux-thunk";
import {
  OPEN_BRANCHES,
  CLOSE_BRANCHES,
  openBranches,
  closeBranches,
  toggleBranches,
} from "../branches";
import { DispatchFn, ReleasesReduxState } from "../../../../types/releaseTypes";

const mockStore = configureMockStore<ReleasesReduxState, DispatchFn>([thunk]);


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
        branches: [],
      } as unknown as ReleasesReduxState);

      store.dispatch(toggleBranches("test"));

      const actions = store.getActions();
      const expectedAction = openBranches("test");
      expect(actions).toEqual([expectedAction]);
    });
    it("should create a CLOSE_BRANCHES action if the branch is in the branches list", () => {
      const store = mockStore({
        branches: ["test"],
      } as unknown as ReleasesReduxState);

      store.dispatch(toggleBranches("test"));

      const actions = store.getActions();
      const expectedAction = closeBranches("test");
      expect(actions).toEqual([expectedAction]);
    });
  });
});
