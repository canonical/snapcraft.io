import configureStore from "redux-mock-store";
import { thunk } from "redux-thunk";

const mockStore = configureStore<ReleasesReduxState, DispatchFn>([thunk]);

import {
  UPDATE_RELEASES,
  handleCloseResponse,
  handleReleaseResponse,
  updateReleases,
  releaseRevisions,
} from "../releases";
import {
  CloseChannelsResponse,
  DispatchFn,
  FetchReleasePayload,
  FetchReleaseResponse,
  Release,
  ReleasesReduxState,
  Revision,
} from "../../../../types/releaseTypes";
import { Mock } from "vitest";

describe("releases actions", () => {
  describe("updateReleases", () => {
    let releases = [{ revision: 1 }, { revision: 2 }] as Release[];

    it("should create an action to update releases list", () => {
      expect(updateReleases(releases).type).toBe(UPDATE_RELEASES);
    });

    it("should supply a payload with releases list", () => {
      expect(updateReleases(releases).payload.releases).toEqual(releases);
    });
  });

  describe("handleCloseResponse", () => {
    it("should dispatch CLOSE_CHANNEL_SUCCESS when successfull", () => {
      const store = mockStore({} as ReleasesReduxState);

      const dispatch = store.dispatch;

      const apiResponse = {
        success: true,
        closed_channels: ["edge"],
      } as CloseChannelsResponse;

      handleCloseResponse(dispatch, apiResponse, ["latest/edge"]);

      const actions = store.getActions();

      expect(actions[0]).toEqual({
        payload: {
          channel: "latest/edge",
        },
        type: "CLOSE_CHANNEL_SUCCESS",
      });
    });

    it("should throw an error if the API responds with an error", () => {
      expect(() => {
        handleCloseResponse(() => {}, { success: false, errors: ["nope"] }, [
          "latest/edge",
        ]);
      }).toThrow();
    });
  });

  describe("handleReleaseResponse", () => {
    describe("RELEASE_REVISION_SUCCESS", () => {
      it("should be dispatched if revision is passed", () => {
        const store = mockStore({} as ReleasesReduxState);

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
                    version: "test",
                  },
                ],
              },
            },
          },
        } as unknown as FetchReleaseResponse;

        const release = [
          {
            id: 3,
            revision: 3,
            channels: ["latest/edge"],
          },
        ] as unknown as FetchReleasePayload;

        const revision = {
          architectures: ["amd64"],
          revision: 3,
        } as unknown as Revision;

        const revisions = {
          3: revision,
        };

        handleReleaseResponse(dispatch, json, release, revisions);

        const actions = store.getActions();

        expect(actions[0]).toEqual({
          payload: {
            channel: "latest/edge",
            revision: revision,
          },
          type: "RELEASE_REVISION_SUCCESS",
        });
      });

      it("should be dispatched if there are no revisions", () => {
        const store = mockStore({} as ReleasesReduxState);

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
                    version: "test",
                  },
                ],
              },
            },
          },
        } as unknown as FetchReleaseResponse;

        const revision = {
          architectures: ["amd64"],
          revision: 3,
          version: "test",
        };

        const release = {
          id: 4,
          revision: revision,
          channels: ["latest/edge"],
        } as unknown as FetchReleasePayload;

        handleReleaseResponse(dispatch, json, release, {});

        const actions = store.getActions();

        expect(actions[0]).toEqual({
          payload: {
            channel: "latest/edge",
            revision: revision,
          },
          type: "RELEASE_REVISION_SUCCESS",
        });
      });
    });
  });

  describe("releaseRevisions", () => {
    afterEach(() => {
      (global.fetch as Mock).mockRestore();
    });

    it("should generate progressive key if null", () => {
      const revision = { architectures: ["amd64"], revision: 1 };
      const store = mockStore({
        options: {
          snapName: "test",
          defaultTrack: "latest",
        },
        pendingReleases: {
          1: {
            "latest/edge": {
              revision: revision,
              channel: "latest/edge",
              progressive: {
                key: null,
                percentage: 50,
                paused: false,
              },
            },
          },
        },
      } as unknown as ReleasesReduxState);

      global.fetch = vi
        .fn()
        .mockResolvedValue({ json: () => ({ success: true }) });

      return store.dispatch(releaseRevisions()).then(() => {
        const calls = (global.fetch as Mock).mock.calls;

        expect(JSON.parse(calls[0][1].body).progressive.key).toBeDefined();
      });
    });

    it("should combine releases of the same revision that aren't progressive", () => {
      const revision = { architectures: ["amd64"], revision: 1 };
      const store = mockStore({
        options: {
          snapName: "test",
          defaultTrack: "latest",
        },
        pendingReleases: {
          1: {
            "latest/edge": {
              revision: revision,
              channel: "latest/edge",
              progressive: {
                key: "test",
                percentage: 50,
                paused: false,
              },
            },
            "latest/beta": {
              revision: revision,
              channel: "latest/beta",
            },
            "latest/candidate": {
              revision: revision,
              channel: "latest/candidate",
            },
          },
        },
      } as unknown as ReleasesReduxState);

      global.fetch = vi.fn().mockResolvedValue({
        json: () => ({ success: true, channel_map_tree: {} }),
      });

      return store.dispatch(releaseRevisions()).then(() => {
        const calls = (global.fetch as Mock).mock.calls;

        expect(calls.length).toEqual(3); // 2 posts and 1 get

        expect(JSON.parse(calls[0][1].body)).toEqual({
          name: "test",
          revision: 1,
          channels: ["latest/edge"],
          progressive: {
            key: "test",
            percentage: 50,
            paused: false,
          },
        });

        expect(JSON.parse(calls[1][1].body)).toEqual({
          name: "test",
          revision: 1,
          channels: ["latest/beta", "latest/candidate"],
        });
      });
    });

    it("should remove progressive release if percentage is 100", () => {
      const release = {
        architecture: "amd64",
        branch: null,
        revision: 3,
        risk: "edge",
        track: "latest",
      };

      const revision = {
        architectures: ["amd64"],
        revision: 3,
      };

      const store = mockStore({
        options: {
          snapName: "test",
          defaultTrack: "latest",
        },
        pendingReleases: {
          3: {
            "latest/edge": {
              revision: revision,
              channel: "latest/edge",
              progressive: {
                key: "test",
                percentage: 100,
                paused: false,
              },
            },
          },
        },
        revisions: {
          3: revision,
        },
        architectures: [],
      } as unknown as ReleasesReduxState);

      global.fetch = vi
        .fn()
        // fetchReleases API Response
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
                      version: "test",
                    },
                  ],
                },
              },
            },
          }),
        })
        // fetchReleasesHistory API Response
        .mockResolvedValueOnce({
          json: () => ({
            data: {
              release_history: {
                releases: [release],
                revisions: [revision],
              },
              channel_map: [
                {
                  channel: "edge",
                  info: "specific",
                  revision: 3,
                  version: "test",
                  architecture: "amd64",
                },
              ],
            },
          }),
        });

      return store.dispatch(releaseRevisions()).then(() => {
        const actions = store.getActions();
        expect(actions).toEqual([
          {
            type: "HIDE_NOTIFICATION",
          },
          {
            payload: {
              channel: "latest/edge",
              revision: revision,
            },
            type: "RELEASE_REVISION_SUCCESS",
          },
          {
            type: "CANCEL_PENDING_RELEASES",
          },
          {
            payload: {
              revisions: {
                3: revision,
              },
            },
            type: "UPDATE_REVISIONS",
          },
          {
            payload: {
              releases: [release],
            },
            type: "UPDATE_RELEASES",
          },
          {
            payload: {
              architectures: ["amd64"],
            },
            type: "UPDATE_ARCHITECTURES",
          },
          {
            payload: {
              channelMap: {
                edge: {
                  amd64: {
                    architectures: ["amd64"],
                    channels: ["latest/edge"],
                    expiration: undefined,
                    progressive: undefined,
                    releases: [release],
                    revision: 3,
                  },
                },
              },
            },
            type: "INIT_CHANNEL_MAP",
          },
          {
            payload: {
              failedRevisions: [],
            },
            type: "UPDATE_FAILED_REVISIONS",
          },
          {
            type: "CLOSE_HISTORY",
          },
        ]);
      });
    });

    it("should handle an error", () => {
      const store = mockStore({
        options: {
          snapName: "test",
          defaultTrack: "latest",
        },
        pendingReleases: {},
      } as unknown as ReleasesReduxState);

      global.fetch = vi
        .fn()
        // fetchReleases API Response
        .mockResolvedValueOnce({
          json: () => ({
            success: true,
          }),
        });

      return store.dispatch(releaseRevisions()).then(() => {
        const actions = store.getActions();
        expect(actions[1].payload.status).toEqual("error");
        expect(actions[1].payload.content.length).toBeGreaterThan(0);
      });
    });

    it("should dispatch all the actions", () => {
      const revision = {
        architectures: ["amd64"],
        revision: 3,
      };
      const release = {
        architecture: "amd64",
        branch: null,
        revision: 3,
        risk: "edge",
        track: "latest",
        progressive: {
          key: "test",
          percentage: 50,
          paused: false,
        },
      };
      const store = mockStore({
        options: {
          snapName: "test",
          defaultTrack: "latest",
        },
        pendingReleases: {
          3: {
            "latest/edge": {
              revision: revision,
              channel: "latest/edge",
              progressive: {
                key: "test",
                percentage: 50,
                paused: false,
              },
            },
          },
        },
        pendingCloses: ["latest/edge"],
        revisions: {
          3: revision,
        },
        architectures: [],
      } as unknown as ReleasesReduxState);

      global.fetch = vi
        .fn()
        // fetchReleases API Response
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
                      version: "test",
                      architecture: "amd64",
                    },
                  ],
                },
              },
            },
          }),
        })
        // fetchCloses API Response
        .mockResolvedValueOnce({
          json: () => ({
            success: true,
            closed_channels: ["edge"],
          }),
        })
        // fetchReleasesHistory API Response
        .mockResolvedValueOnce({
          json: () => ({
            data: {
              release_history: {
                releases: [release],
                revisions: [revision],
              },
              channel_map: [
                {
                  channel: "edge",
                  info: "specific",
                  revision: 3,
                  version: "test",
                  architecture: "amd64",
                },
              ],
            },
          }),
        });

      return store.dispatch(releaseRevisions()).then(() => {
        const actions = store.getActions();
        expect(actions).toEqual([
          {
            type: "HIDE_NOTIFICATION",
          },
          {
            payload: {
              channel: "latest/edge",
              revision: revision,
            },
            type: "RELEASE_REVISION_SUCCESS",
          },
          {
            payload: {
              channel: "latest/edge",
            },
            type: "CLOSE_CHANNEL_SUCCESS",
          },
          {
            type: "CANCEL_PENDING_RELEASES",
          },
          {
            payload: {
              revisions: {
                3: revision,
              },
            },
            type: "UPDATE_REVISIONS",
          },
          {
            payload: {
              releases: [release],
            },
            type: "UPDATE_RELEASES",
          },
          {
            payload: {
              architectures: ["amd64"],
            },
            type: "UPDATE_ARCHITECTURES",
          },
          {
            payload: {
              channelMap: {
                edge: {
                  amd64: {
                    architectures: ["amd64"],
                    channels: ["latest/edge"],
                    expiration: undefined,
                    progressive: undefined,
                    releases: [release],
                    revision: 3,
                  },
                },
              },
            },
            type: "INIT_CHANNEL_MAP",
          },
          {
            payload: {
              failedRevisions: [],
            },
            type: "UPDATE_FAILED_REVISIONS",
          },
          {
            type: "CLOSE_HISTORY",
          },
        ]);
      });
    });
  });
});
