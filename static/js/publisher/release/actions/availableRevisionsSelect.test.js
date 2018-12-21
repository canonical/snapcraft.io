import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

const mockStore = configureMockStore([thunk]);

import {
  SET_AVAILABLE_REVISIONS_SELECT,
  setAvailableRevisionsSelect,
  selectAvailableRevisions
} from "./availableRevisionsSelect";
import { selectRevision, clearSelectedRevisions } from "./channelMap";
import { AVAILABLE_REVISIONS_SELECT_UNRELEASED } from "../constants";

describe("availableRevisionsSelect actions", () => {
  describe("setAvailableRevisionsSelect", () => {
    const value = "test";

    it("should create an action to set value of available revisions select", () => {
      expect(setAvailableRevisionsSelect(value).type).toBe(
        SET_AVAILABLE_REVISIONS_SELECT
      );
    });

    it("should supply a payload with a value to set", () => {
      expect(setAvailableRevisionsSelect(value).payload.value).toEqual(value);
    });
  });

  describe("selectAvailableRevisions", () => {
    const value = "test";
    const revisions = {
      1: { revision: 1, architectures: ["test64", "amd42"] },
      2: { revision: 2, architectures: ["test64"] },
      3: { revision: 3, architectures: ["abc42"], channels: ["test/edge"] }
    };
    let store;

    beforeEach(() => {
      store = mockStore({
        // mock store state is not modified by actions
        // so this is the value we expect after the actions are dispatched
        availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_UNRELEASED,
        revisions
      });

      store.dispatch(selectAvailableRevisions(value));
    });

    it("should dispatch SET_AVAILABLE_REVISIONS_SELECT action", () => {
      expect(store.getActions()).toContainEqual(
        setAvailableRevisionsSelect(value)
      );
    });

    it("should dispatch CLEAR_SELECTED_REVISIONS action", () => {
      expect(store.getActions()).toContainEqual(clearSelectedRevisions());
    });

    it("should dispatch SELECT_REVISION action for latest revision from every selected architecture", () => {
      expect(store.getActions()).toContainEqual(selectRevision(revisions[1]));
      expect(store.getActions()).toContainEqual(selectRevision(revisions[2]));
    });

    it("should not dispatch SELECT_REVISION action for not selected revisions", () => {
      expect(store.getActions()).not.toContainEqual(
        selectRevision(revisions[3])
      );
    });
  });
});
