import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

const mockStore = configureMockStore([thunk]);

import {
  SET_AVAILABLE_REVISIONS_SELECT,
  setAvailableRevisionsSelect,
  selectAvailableRevisions
} from "./availableRevisionsSelect";
import {
  SELECT_REVISION,
  selectRevision,
  clearSelectedRevisions
} from "./channelMap";
import {
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD
} from "../constants";

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

    describe("when 'Recent' are selected", () => {
      const value = AVAILABLE_REVISIONS_SELECT_RECENT;

      describe("when there are no revisions", () => {
        const revisions = {};

        it("should not dispatch any SELECT_REVISION actions", () => {
          store = mockStore({
            // mock store state is not modified by actions
            // so this is the value we expect after the actions are dispatched
            availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_RECENT,
            revisions
          });
          store.dispatch(selectAvailableRevisions(value));

          const actions = store.getActions();

          expect(actions).not.toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                type: SELECT_REVISION
              })
            ])
          );
        });
      });

      describe("when there are revisions in the state", () => {
        const revisions = {
          1: {
            revision: 1,
            version: "1.test",
            architectures: ["arch1"],
            created_at: new Date()
          },
          2: {
            revision: 2,
            version: "2.test",
            architectures: ["arch2"],
            created_at: new Date()
          },
          3: {
            revision: 3,
            version: "1.test",
            architectures: ["arch3"],
            created_at: new Date()
          }
        };

        beforeEach(() => {
          store = mockStore({
            // mock store state is not modified by actions
            // so this is the value we expect after the actions are dispatched
            availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_RECENT,
            revisions
          });

          store.dispatch(selectAvailableRevisions(value));
        });

        it("should dispatch SELECT_REVISION action for latest revisions with most recent version", () => {
          expect(store.getActions()).toContainEqual(
            selectRevision(revisions[1])
          );
          expect(store.getActions()).toContainEqual(
            selectRevision(revisions[3])
          );
        });

        it("should not dispatch SELECT_REVISION action for latest revisions with other versions", () => {
          expect(store.getActions()).not.toContainEqual(
            selectRevision(revisions[2])
          );
        });
      });
    });

    describe("when 'Launchpad' is selected", () => {
      const value = AVAILABLE_REVISIONS_SELECT_LAUNCHPAD;

      describe("when there are no revisions", () => {
        const revisions = {};

        it("should not dispatch any SELECT_REVISION actions", () => {
          store = mockStore({
            // mock store state is not modified by actions
            // so this is the value we expect after the actions are dispatched
            availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
            revisions
          });
          store.dispatch(selectAvailableRevisions(value));

          const actions = store.getActions();

          expect(actions).not.toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                type: SELECT_REVISION
              })
            ])
          );
        });
      });

      describe("when there are revisions in the state", () => {
        const revisions = {
          1: {
            revision: 1,
            architectures: ["arch1"],
            attributes: { "build-request-id": "lp-1" },
            created_at: new Date()
          },
          2: {
            revision: 2,
            architectures: ["arch2"],
            attributes: { "build-request-id": "lp-2" },
            created_at: new Date()
          },
          3: {
            revision: 3,
            architectures: ["arch3"],
            attributes: { "build-request-id": "lp-1" },
            created_at: new Date()
          }
        };

        beforeEach(() => {
          store = mockStore({
            // mock store state is not modified by actions
            // so this is the value we expect after the actions are dispatched
            availableRevisionsSelect: AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
            revisions
          });

          store.dispatch(selectAvailableRevisions(value));
        });

        it("should dispatch SELECT_REVISION action for latest revisions with most recent build id", () => {
          expect(store.getActions()).toContainEqual(
            selectRevision(revisions[1])
          );
          expect(store.getActions()).toContainEqual(
            selectRevision(revisions[3])
          );
        });

        it("should not dispatch SELECT_REVISION action for latest revisions with other versions", () => {
          expect(store.getActions()).not.toContainEqual(
            selectRevision(revisions[2])
          );
        });
      });
    });
  });
});
