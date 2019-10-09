/* global global, jest */

import configureStore from "redux-mock-store";
import thunk from "redux-thunk";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

import { DEFAULT_ERROR_MESSAGE as ERROR_MESSAGE } from "../constants";

import {
  UPDATE_RELEASES,
  handleCloseResponse,
  getErrorMessage,
  handleReleaseResponse,
  updateReleases,
  releaseRevisions
} from "./releases";

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

  describe("handleCloseResponse", () => {
    it("should dispatch CLOSE_CHANNEL_SUCCESS when successfull", () => {
      const store = mockStore({});

      handleCloseResponse(
        store.dispatch,
        {
          success: true,
          closed_channels: ["edge"]
        },
        ["latest/edge"]
      );

      const actions = store.getActions();

      expect(actions[0]).toEqual({
        payload: {
          channel: "latest/edge"
        },
        type: "CLOSE_CHANNEL_SUCCESS"
      });
    });

    it("should throw an error if the API responds with an error", () => {
      expect(() => {
        handleCloseResponse(() => {}, { error: true, json: "nope" }, [
          "latest/edge"
        ]);
      }).toThrow();
    });
  });

  describe("getErrorMessage", () => {
    it("should return the default error message if no error is defined", () => {
      expect(getErrorMessage({})).toEqual(ERROR_MESSAGE);
    });

    it("should return error.message if defined", () => {
      expect(getErrorMessage({ message: "error!" })).toEqual("error!");
    });

    it("should return multiple messages if errors.json is an array", () => {
      expect(
        getErrorMessage({
          message: "error!",
          json: [{ message: "error1" }, { message: "error2" }]
        })
      ).toEqual("error! error1 error2");
    });

    it("should return multiple message if errors.json.errors is an array", () => {
      expect(
        getErrorMessage({
          message: "error!",
          json: { errors: [{ message: "error1" }, { message: "error2" }] }
        })
      ).toEqual("error! error1 error2");
    });
  });

  describe("handleReleaseResponse", () => {
    it("should dispatch all the actions", () => {
      const store = mockStore({});

      const dispatch = store.dispatch;
      const json = {
        success: true,
        channel_map_tree: {
          latest: {
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
      };

      const release = [
        {
          id: 3,
          revision: 3,
          channels: ["latest/edge"]
        }
      ];

      const revision = {
        architectures: ["amd64"],
        revision: 3
      };

      const revisions = {
        "3": revision
      };

      handleReleaseResponse(dispatch, json, release, revisions, "latest");

      const actions = store.getActions();

      expect(actions[0]).toEqual({
        payload: {
          channel: "latest/edge",
          revision: revision
        },
        type: "RELEASE_REVISION_SUCCESS"
      });
    });
  });

  describe("releaseRevisions", () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue();
    });
    afterEach(() => {
      global.fetch.mockRestore();
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
          defaultTrack: "latest"
        },
        pendingReleases: {
          "3": {
            revision: revision,
            channels: ["latest/edge"]
          }
        },
        pendingCloses: ["latest/edge"],
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
              latest: {
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
            success: true,
            closed_channels: ["edge"]
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
            channel: "latest/edge",
            revision: revision
          },
          type: "RELEASE_REVISION_SUCCESS"
        });

        expect(actions[2]).toEqual({
          payload: {
            channel: "latest/edge"
          },
          type: "CLOSE_CHANNEL_SUCCESS"
        });

        expect(actions[3]).toEqual({
          payload: {
            revisions: {
              3: revision
            }
          },
          type: "UPDATE_REVISIONS"
        });

        expect(actions[4]).toEqual({
          payload: {
            releases: [release]
          },
          type: "UPDATE_RELEASES"
        });

        expect(actions[5]).toEqual({
          type: "CANCEL_PENDING_RELEASES"
        });
      });
    });
  });
});
