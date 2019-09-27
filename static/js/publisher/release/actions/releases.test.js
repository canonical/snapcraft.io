/* global global, jest */

import configureStore from "redux-mock-store";
import thunk from "redux-thunk";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

import { UPDATE_RELEASES, updateReleases, releaseRevisions } from "./releases";
import { DEFAULT_ERROR_MESSAGE } from "../constants";

describe("releases actions", () => {
  describe("updateReleases", () => {
    let releases = [{ revision: 1 }, { revision: 2 }];

    it("should create an action to update releases list", () => {
      expect(updateReleases(releases).type).toBe(UPDATE_RELEASES);
    });

    it("should supply a payload with releases list", () => {
      expect(updateReleases(releases).payload.releases).toEqual(releases);
    });
  });

  describe("releaseRevisions", () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue();
    });
    afterEach(() => {
      global.fetch.mockRestore();
    });

    it("should handle release error", () => {
      const store = mockStore({
        options: {
          snapName: "test",
          csrfToken: "test",
          defaultTrack: "test"
        },
        pendingReleases: {},
        pendingCloses: [],
        revisions: {}
      });

      return store.dispatch(releaseRevisions()).then(() => {
        const actions = store.getActions();
        expect(actions[1]).toEqual({
          payload: {
            appearance: "negative",
            content: DEFAULT_ERROR_MESSAGE,
            status: "error"
          },
          type: "SHOW_NOTIFICATION"
        });
      });
    });

    it("should dispatch RELEASE_REVISION_SUCCESS", () => {
      const revision = {
        architectures: ["amd64"],
        revision: 3
      };
      const release = {
        architecture: "amd64",
        branch: null,
        revision: 3,
        risk: "edge",
        track: "latest"
      };
      const store = mockStore({
        options: {
          snapName: "test",
          csrfToken: "test",
          defaultTrack: "test"
        },
        pendingReleases: {
          "3": {
            revision: revision,
            channels: ["latest/edge"]
          }
        },
        pendingCloses: [],
        revisions: {
          "3": revision
        }
      });

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          json: () => ({
            success: true,
            channel_map_tree: {
              test: {
                16: {
                  amd64: [
                    {
                      channel: "edge",
                      info: "specific",
                      revision: 3,
                      version: "test"
                    }
                  ]
                }
              }
            }
          })
        })
        .mockResolvedValueOnce({
          json: () => ({
            releases: [release],
            revisions: [revision]
          })
        });

      return store.dispatch(releaseRevisions()).then(() => {
        const actions = store.getActions();
        expect(actions[0]).toEqual({
          type: "HIDE_NOTIFICATION"
        });

        expect(actions[1]).toEqual({
          payload: {
            channel: "test/edge",
            revision: revision
          },
          type: "RELEASE_REVISION_SUCCESS"
        });

        expect(actions[2]).toEqual({
          payload: {
            revisions: {
              3: revision
            }
          },
          type: "UPDATE_REVISIONS"
        });

        expect(actions[3]).toEqual({
          payload: {
            releases: [release]
          },
          type: "UPDATE_RELEASES"
        });

        expect(actions[4]).toEqual({
          type: "CANCEL_PENDING_RELEASES"
        });
      });
    });
  });
});
