import { UnknownAction } from "@reduxjs/toolkit";
import reducer, {
  updateReleases,
  releaseRevisions,
  updateReleasesUI,
} from "../releases";
import type {
  ReleasesState,
  PendingChangesState,
  Revision,
  FetchReleaseResponse,
  CloseChannelsResponse,
  ReleasesAPIResponse,
  PendingReleaseItem,
} from "../../../../types/releaseTypes";
import type { AppDispatch, RootState } from "../../store";
import { hideNotification, showNotification } from "../notification";
import { cancelPendingChanges } from "../pendingChanges";
import {
  releaseRevisionSuccess,
  closeChannelSuccess,
  initChannelMap,
} from "../channelMap";
import { closeHistory } from "../history";
import { releasesReady } from "../options";
import { updateRevisions } from "../revisions";
import { updateArchitectures } from "../architectures";
import { updateFailedRevisions } from "../failedRevisions";
import { DEFAULT_ERROR_MESSAGE as ERROR_MESSAGE } from "../../constants";
import {
  fetchRelease,
  fetchClose,
  fetchSnapReleaseStatus,
} from "../../api/releases";
import {
  getReleaseDataFromChannelMap,
  getRevisionsMap,
  initReleasesData,
} from "../../releasesState";

vi.mock("../../api/releases", () => ({
  fetchRelease: vi.fn(),
  fetchClose: vi.fn(),
  fetchSnapReleaseStatus: vi.fn(),
}));

vi.mock("../../releasesState", () => ({
  getReleaseDataFromChannelMap: vi.fn(),
  getRevisionsMap: vi.fn(),
  initReleasesData: vi.fn(),
}));

function makeRevision(id: number): Revision {
  return {
    revision: id,
    architectures: ["amd64"],
    attributes: {},
    base: "core20",
    build_url: null,
    confinement: "strict",
    created_at: "2024-01-01T00:00:00Z",
    epoch: { read: [0], write: [0] },
    grade: "stable",
    "sha3-384": "abc123",
    size: 1000,
    status: "Published",
    version: `${id}.0`,
  } as Revision;
}

function makeArchitectureReleaseChannelMap() {
  return {
    "amd64": [],
    "arm64": [],
    "armhf": [],
    "i386": [],
    "powerpc": [],
    "ppc64el": [],
    "riscv64": [],
    "s390x": [],
  };
}

describe("releases", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual([]);
  });

  describe("on releases/updateReleases action", () => {
    const newReleases = [
      { revision: 1 },
      { revision: 2 },
      { revision: 3 },
    ] as unknown as ReleasesState;

    it("should set releases to the given list", () => {
      const result = reducer([], updateReleases(newReleases));
      expect(result).toEqual(newReleases);
    });

    it("should replace existing releases in state", () => {
      const initialState = [
        { revision: 5 },
        { revision: 6 },
      ] as unknown as ReleasesState;

      const result = reducer(initialState, updateReleases(newReleases));
      expect(result).toEqual(newReleases);
    });
  });

  describe("releaseRevisions async thunk", () => {
    const snapName = "my-snap";
    const emptyPendingChanges: PendingChangesState = {
      changeOrderIndex: 0,
      pendingCloses: {},
      pendingReleases: {},
    };

    function makeGetState(
      pendingChanges: PendingChangesState,
      revisions: Record<string | number, Revision> = {}
    ) {
      return () =>
        ({
          pendingChanges,
          revisions,
          options: { snapName, flags: {}, releasesReady: false },
        }) as unknown as RootState;
    }

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(fetchRelease).mockResolvedValue({
        success: true,
        channel_map: [],
        channel_map_tree: {},
        opened_channels: [],
      });
      vi.mocked(fetchClose).mockResolvedValue({
        success: true,
        channel_maps: makeArchitectureReleaseChannelMap(),
        closed_channels: [],
      });
      vi.mocked(fetchSnapReleaseStatus).mockResolvedValue(
        {} as ReleasesAPIResponse
      );
    });

    it("should refresh data and dispatch actions", async () => {
      const dispatch = vi.fn() as unknown as AppDispatch;

      await releaseRevisions()(dispatch, makeGetState(emptyPendingChanges), undefined);

      expect(fetchSnapReleaseStatus).toHaveBeenCalledWith(snapName);
      expect(dispatch).toHaveBeenCalledWith(hideNotification());
      // updateReleasesUI is a createAsyncThunk, so dispatching it passes a thunk function
      expect(dispatch).toHaveBeenCalledWith(expect.any(Function));
      expect(dispatch).toHaveBeenCalledWith(cancelPendingChanges());
      expect(dispatch).toHaveBeenCalledWith(closeHistory());
    });

    describe("when there are no pending releases", () => {
      it("should not call fetchRelease", async () => {
        const dispatch = vi.fn() as unknown as AppDispatch;

        await releaseRevisions()(dispatch, makeGetState(emptyPendingChanges), undefined);

        expect(fetchRelease).not.toHaveBeenCalled();
      });

      it("should not dispatch any releaseRevisionSuccess", async () => {
        const dispatch = vi.fn() as unknown as AppDispatch;

        await releaseRevisions()(dispatch, makeGetState(emptyPendingChanges), undefined);

        const dispatchedTypes = vi
          .mocked(dispatch)
          .mock.calls.filter(([action]) => action && typeof action === "object")
          .map(([action]) => (action as { type?: string }).type);
        expect(dispatchedTypes).not.toContain(releaseRevisionSuccess.type);
      });
    });

    describe("when there are pending releases", () => {
      const pendingRevision = makeRevision(1);
      const pendingChanges: PendingChangesState = {
        changeOrderIndex: 1,
        pendingCloses: {},
        pendingReleases: {
          0: {
            revision: pendingRevision,
            channel: "latest/stable",
            previousReleases: [],
          },
        },
      };

      const successResponse: FetchReleaseResponse = {
        success: true,
        channel_map: [],
        channel_map_tree: {
          latest: {
            "16": {
              ...makeArchitectureReleaseChannelMap(),
              amd64: [
                { channel: "stable", revision: 1, version: "1.0", info: "released" },
              ],
            },
          },
        },
        opened_channels: [],
      };

      beforeEach(() => {
        vi.mocked(fetchRelease).mockResolvedValue(successResponse);
      });

      it("should call fetchRelease for each pending release", async () => {
        const dispatch = vi.fn() as unknown as AppDispatch;

        await releaseRevisions()(
          dispatch,
          makeGetState(pendingChanges, { 1: pendingRevision }),
          undefined
        );

        expect(fetchRelease).toHaveBeenCalledWith(
          snapName,
          1,
          ["latest/stable"],
          null
        );
      });

      it("should dispatch a releaseRevisionSuccess for each pending release", async () => {
        const dispatch = vi.fn() as unknown as AppDispatch;

        await releaseRevisions()(
          dispatch,
          makeGetState(pendingChanges, { 1: pendingRevision }),
          undefined
        );

        expect(dispatch).toHaveBeenCalledWith(
          releaseRevisionSuccess({ revision: pendingRevision, channel: "latest/stable" })
        );
      });

      it("should dispatch an error notification if a fetchRelease fails", async () => {
        vi.mocked(fetchRelease).mockRejectedValue(new Error("API error"));
        const dispatch = vi.fn() as unknown as AppDispatch;

        await releaseRevisions()(dispatch, makeGetState(pendingChanges), undefined);

        expect(dispatch).toHaveBeenCalledWith(
          showNotification({
            status: "error",
            appearance: "negative",
            content: ERROR_MESSAGE,
          })
        );
      });
    });

    describe("when there are duplicate pending releases", () => {
      const pendingRevision = makeRevision(1);
      const pendingChangesWithDuplicates: PendingChangesState = {
        changeOrderIndex: 2,
        pendingCloses: {},
        pendingReleases: {
          0: {
            revision: pendingRevision,
            channel: "latest/stable",
            previousReleases: [],
          },
          1: {
            revision: pendingRevision,
            channel: "latest/edge",
            previousReleases: [],
          },
        },
      };

      it("should call fetchRelease for each pending release", async () => {
        const dispatch = vi.fn() as unknown as AppDispatch;

        await releaseRevisions()(
          dispatch,
          makeGetState(pendingChangesWithDuplicates, { 1: pendingRevision }),
          undefined
        );

        expect(fetchRelease).toHaveBeenCalledTimes(2);
        expect(fetchRelease).toHaveBeenNthCalledWith(1, snapName, 1, ["latest/stable"], null);
        expect(fetchRelease).toHaveBeenNthCalledWith(2, snapName, 1, ["latest/edge"], null);
      });

      it("should dispatch a releaseRevisionSuccess for each pending release", async () => {
        const successResponse: FetchReleaseResponse = {
          success: true,
          channel_map: [],
          channel_map_tree: {
            latest: {
              "16": {
                ...makeArchitectureReleaseChannelMap(),
                amd64: [
                  { channel: "stable", revision: 1, version: "1.0", info: "" },
                ],
              },
            },
          },
          opened_channels: [],
        };
        vi.mocked(fetchRelease).mockResolvedValue(successResponse);
        const dispatch = vi.fn() as unknown as AppDispatch;

        await releaseRevisions()(
          dispatch,
          makeGetState(pendingChangesWithDuplicates, { 1: pendingRevision }),
          undefined
        );

        expect(fetchRelease).toHaveBeenCalledTimes(2);
        const releaseSuccessActions = vi
          .mocked(dispatch)
          .mock.calls.filter(
            ([action]) =>
              action &&
              typeof action === "object" &&
              (action as { type?: string }).type === releaseRevisionSuccess.type
          );
        expect(releaseSuccessActions).toHaveLength(2);
      });
    });

    describe("when there are pending closes", () => {
      const pendingChangesWithCloses: PendingChangesState = {
        changeOrderIndex: 1,
        pendingCloses: { 0: "latest/stable" },
        pendingReleases: {},
      };

      const closeResponse: CloseChannelsResponse = {
        success: true,
        channel_maps: makeArchitectureReleaseChannelMap(),
        closed_channels: ["latest/stable"],
      };

      beforeEach(() => {
        vi.mocked(fetchClose).mockResolvedValue(closeResponse);
      });

      it("should call fetchClose for each pending close channel", async () => {
        const dispatch = vi.fn() as unknown as AppDispatch;

        await releaseRevisions()(
          dispatch,
          makeGetState(pendingChangesWithCloses),
          undefined
        );

        expect(fetchClose).toHaveBeenCalledWith(
          snapName,
          ["latest/stable"]
        );
      });

      it("should dispatch a closeChannelSuccess for each pending close channel", async () => {
        const dispatch = vi.fn() as unknown as AppDispatch;

        await releaseRevisions()(
          dispatch,
          makeGetState(pendingChangesWithCloses),
          undefined
        );

        expect(dispatch).toHaveBeenCalledWith(closeChannelSuccess("latest/stable"));
      });

      it("should dispatch an error notification if a fetchClose fails", async () => {
        vi.mocked(fetchClose).mockRejectedValue(new Error("Close error"));
        const dispatch = vi.fn() as unknown as AppDispatch;

        await releaseRevisions()(
          dispatch,
          makeGetState(pendingChangesWithCloses),
          undefined
        );

        expect(dispatch).toHaveBeenCalledWith(
          showNotification({
            status: "error",
            appearance: "negative",
            content: ERROR_MESSAGE,
          })
        );
      });
    });
  });

  describe("updateReleasesUI async thunk", () => {
    const mockApiData = {
      success: true,
      data: {
        channel_map: [],
        default_track: "latest",
        private: false,
        publisher_name: "test-publisher",
        release_history: {
          _links: { self: "/" },
          releases: [],
          revisions: [],
          snap: {} as ReleasesAPIResponse["data"]["release_history"]["snap"],
        },
        snap_name: "test-snap",
        snap_title: "Test Snap",
        tracks: [] as unknown as ReleasesAPIResponse["data"]["tracks"],
      },
    } as ReleasesAPIResponse;

    const getState = () => ({}) as unknown as RootState;

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(getReleaseDataFromChannelMap).mockResolvedValue([{}, [], []]);
      vi.mocked(getRevisionsMap).mockReturnValue({});
      vi.mocked(initReleasesData).mockReturnValue([]);
    });

    it("should dispatch multiple actions on success", async () => {
      const dispatch = vi.fn() as unknown as AppDispatch;

      await updateReleasesUI(mockApiData)(dispatch, getState, undefined);

      expect(dispatch).toHaveBeenCalledWith(updateRevisions({}));
      expect(dispatch).toHaveBeenCalledWith(updateReleases([]));
      expect(dispatch).toHaveBeenCalledWith(updateArchitectures([]));
      expect(dispatch).toHaveBeenCalledWith(initChannelMap({}));
      expect(dispatch).toHaveBeenCalledWith(updateFailedRevisions([]));
      expect(dispatch).toHaveBeenCalledWith(releasesReady(true));
    });

    it("should dispatch showNotification on failure", async () => {
      vi.mocked(getReleaseDataFromChannelMap).mockRejectedValue(
        new Error("API error")
      );
      const dispatch = vi.fn() as unknown as AppDispatch;

      await updateReleasesUI(mockApiData)(dispatch, getState, undefined);

      expect(dispatch).toHaveBeenCalledWith(
        showNotification({
          status: "error",
          appearance: "negative",
          content: ERROR_MESSAGE,
        })
      );
    });
  });
});
