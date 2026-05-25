import { UnknownAction, configureStore } from "@reduxjs/toolkit";
import reducer, {
  addPendingRelease,
  removePendingRelease,
  cancelPendingChanges,
  setProgressiveRelease,
  updateProgressiveRelease,
  releaseRevision,
  promoteRevision,
  promoteChannel,
  undoRelease,
  closeChannel,
  closeRevision,
  incrementOrderIndex,
} from "../pendingChanges";
import historyReducer from "../history";
import { closeModal, CLOSE_MODAL_ACTION_NAME } from "../modal";
import type {
  CPUArchitecture,
  PendingChangesState,
  PendingReleaseItem,
  Progressive,
  Revision,
} from "../../../../types/releaseTypes";
import type { AppDispatch, RootState } from "../../store";
import { getReleases, getPendingChannelMap } from "../../selectors";
import { createMockRelease, createMockRevision } from "../../../../test-utils";
import * as analytics from "../../analytics";


vi.mock("../../selectors", () => ({
  getReleases: vi.fn().mockReturnValue([]),
  getPendingChannelMap: vi.fn().mockReturnValue({}),
}));

const initialState: PendingChangesState = {
  changeOrderIndex: 0,
  pendingCloses: {},
  pendingReleases: {},
};

const emptyPendingReleaseItem: PendingReleaseItem = {
  revision: createMockRevision({}),
  channel: "",
  previousReleases: [],
}

const makeStore = () => {
  const store = configureStore({
    reducer: { pendingChanges: reducer, history: historyReducer },
  });
  return store as typeof store & { dispatch: AppDispatch };
};

const findPendingRelease = (state: PendingChangesState, revisionId: number) =>
  Object.values(state.pendingReleases).find((pr) => pr.revision.revision === revisionId);

describe("pendingChanges", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual(initialState);
  });

  // ─── incrementOrderIndex ────────────────────────────────────────────────────

  describe("on pendigChanges/incrementOrderIndex action", () => {
    it("should increase changeOrderIndex by one", () => {
      const result = reducer(initialState, incrementOrderIndex());
      expect(result).toMatchObject({
        changeOrderIndex: 1,
        pendingCloses: {},
        pendingReleases: {},
      });
    });
  });

  // ─── addPendingRelease ──────────────────────────────────────────────────────

  describe("on pendingChanges/addPendingRelease action", () => {
    const revision = {
      revision: 1,
      architectures: ["abc42", "test64"],
    } as unknown as Revision;
    const channel = "test/edge";

    describe("when state is empty", () => {
      it("should add the revision to pending releases", () => {
        const result = reducer(initialState, addPendingRelease({ revision, channel }));
        const pr = findPendingRelease(result, 1);
        expect(pr).toMatchObject({ revision, channel });
      });
    });

    describe("when the same revision is pending release in a different channel", () => {
      const stateWithSamePendingRevision: PendingChangesState = {
        changeOrderIndex: 1,
        pendingCloses: {},
        pendingReleases: {
          0: {
            ...emptyPendingReleaseItem,
            revision: createMockRevision({ revision: 1, architectures: ["abc42", "test64"] }),
            channel: "other/edge",
          },
        },
      };

      it("should add the new channel to the existing pending release entry", () => {
        const result = reducer(
          stateWithSamePendingRevision,
          addPendingRelease({ revision, channel }),
        );
        const pr = Object.values(result.pendingReleases).find(
          (pr) => pr.revision.revision === 1 && pr.channel === channel
        );
        expect(pr).toMatchObject({ revision, channel });
      });
    });

    describe("when another revision is pending in the same arch and channel", () => {
      const conflictingRevision = {
        revision: 4,
        architectures: ["test64"],
      } as unknown as Revision;
      const stateWithConflict: PendingChangesState = {
        changeOrderIndex: 3,
        pendingCloses: {},
        pendingReleases: {
          0: {
            ...emptyPendingReleaseItem,
            revision: createMockRevision({ revision: 2, architectures: ["test64"] }),
            channel: "other/edge",
          },
          1: {
            ...emptyPendingReleaseItem,
            revision: createMockRevision({ revision: 3, architectures: ["armf"] }),
            channel,
          },
          2: {
            ...emptyPendingReleaseItem,
            revision: conflictingRevision,
            channel,
          },
        },
      };

      it("should add the promoted revision to state", () => {
        const result = reducer(stateWithConflict, addPendingRelease({ revision, channel }));
        const pendingRelease = findPendingRelease(result, 1);
        expect(pendingRelease).toBeDefined();
        expect(pendingRelease!.revision).toMatchObject(revision);
        expect(pendingRelease!.channel).toEqual(channel);
      });

      it("should remove the conflicting pending release for the same arch and channel", () => {
        const result = reducer(stateWithConflict, addPendingRelease({ revision, channel }));
        const conflictingPendingRelease = findPendingRelease(result, 4);
        expect(conflictingPendingRelease).toBeUndefined();
      });
    });

    describe("when previousReleases are provided", () => {
      it("should save previousReleases in the pending release item", () => {
        const previousReleases = [
          createMockRevision({ revision: 0, architectures: ["abc42"] }),
        ];
        const result = reducer(
          initialState,
          addPendingRelease({ revision, channel, previousReleases }),
        );
        const pr = findPendingRelease(result, 1);
        expect(pr!.previousReleases).toEqual(previousReleases);
      });
    });

    describe("when progressive state is provided", () => {
      it("should add a pending release with the progressive state", () => {
        const progressive: Progressive = {
          "current-percentage": 0,
          percentage: 10,
          paused: null,
        };
        const result = reducer(
          initialState,
          addPendingRelease({ revision, channel, progressive }),
        );
        const pr = findPendingRelease(result, 1);
        expect(pr!.progressive).toEqual(progressive);
      });
    });

    describe("when channel is pending close", () => {
      it("should NOT cancel the pending close when releasing to the same channel", () => {
        const revision = {
          revision: 1,
          architectures: ["test64"],
        } as unknown as Revision;
        const channel = "test/edge";
        const stateWithPendingClose: PendingChangesState = {
          changeOrderIndex: 1,
          pendingCloses: { 0: channel },
          pendingReleases: {},
        };

        const result = reducer(
          stateWithPendingClose,
          addPendingRelease({ revision, channel }),
        );
        expect(Object.values(result.pendingCloses)).toContain(channel);
      });
    });
  });

  // ─── removePendingRelease ───────────────────────────────────────────────────

  describe("on pendingChanges/removePendingRelease action", () => {
    const revision = {
      revision: 1,
      architectures: ["abc42", "test64"],
    } as unknown as Revision;
    const channel = "test/edge";

    describe("when state is empty", () => {
      it("should not change state if revision is not pending", () => {
        const result = reducer(initialState, removePendingRelease({ revision, channel }));
        expect(result).toEqual(initialState);
      });
    });

    describe("when revision has pending releases in multiple channels", () => {
      it("should remove only the given channel from pending releases", () => {
        const stateWithRevisionInMultipleChannels: PendingChangesState = {
          changeOrderIndex: 2,
          pendingCloses: {},
          pendingReleases: {
            0: {
              ...emptyPendingReleaseItem,
              revision,
              channel,
            },
            1: {
              ...emptyPendingReleaseItem,
              revision,
              channel: "latest/beta",
            },
          },
        };

        const result = reducer(
          stateWithRevisionInMultipleChannels,
          removePendingRelease({ revision, channel }),
        );
        expect(
          Object.values(result.pendingReleases).find(
            (pr) => pr.revision.revision === 1 && pr.channel === channel
          )
        ).toBeUndefined();
        expect(
          Object.values(result.pendingReleases).find(
            (pr) => pr.revision.revision === 1 && pr.channel === "latest/beta"
          )
        ).toBeDefined();
      });
    });

    describe("when revision has a pending release only in the given channel", () => {
      it("should remove the revision entry entirely from state", () => {
        const stateWithSingleChannel: PendingChangesState = {
          changeOrderIndex: 1,
          pendingCloses: {},
          pendingReleases: {
            0: {
              ...emptyPendingReleaseItem,
              revision,
              channel,
            },
          },
        };

        const result = reducer(
          stateWithSingleChannel,
          removePendingRelease({ revision, channel }),
        );
        expect(findPendingRelease(result, 1)).toBeUndefined();
      });
    });
  });

  // ─── cancelPendingChanges ───────────────────────────────────────────────────

  describe("on pendingChanges/cancelPendingChanges action", () => {
    it("should not change state if empty", () => {
      const result = reducer(initialState, cancelPendingChanges());
      expect(result).toEqual(initialState);
    });

    it("should clear all pending releases", () => {
      const stateWithPendingReleases: PendingChangesState = {
        changeOrderIndex: 2,
        pendingCloses: {},
        pendingReleases: {
          0: {
            ...emptyPendingReleaseItem,
            revision: createMockRevision({ revision: 1 }),
            channel: "latest/beta",
          },
          1: {
            ...emptyPendingReleaseItem,
            revision: createMockRevision({ revision: 2 }),
            channel: "latest/stable",
          },
        },
      };

      const result = reducer(stateWithPendingReleases, cancelPendingChanges());
      expect(result.changeOrderIndex).toEqual(0);
      expect(result.pendingReleases).toEqual({});
    });

    it("should clear all pending closes", () => {
      const stateWithPendingCloses: PendingChangesState = {
        changeOrderIndex: 2,
        pendingCloses: { 0: "test/edge", 1: "latest/candidate" },
        pendingReleases: {},
      };

      const result = reducer(stateWithPendingCloses, cancelPendingChanges());
      expect(result.changeOrderIndex).toEqual(0);
      expect(result.pendingCloses).toEqual({});
    });
  });

  // ─── setProgressiveRelease ──────────────────────────────────────────────────

  describe("on pendingChanges/setProgressiveRelease action", () => {
    const progressive: Progressive = {
      "current-percentage": 10,
      percentage: 50,
      paused: null,
    };

    describe("when state is empty", () => {
      it("should not affect empty state", () => {
        const result = reducer(initialState, setProgressiveRelease(progressive));
        expect(result.pendingReleases).toEqual({});
      });
    });

    describe("when there are pending releases without previousReleases", () => {
      it("should not add progressive state", () => {
        const stateWithPendingRevision: PendingChangesState = {
          changeOrderIndex: 1,
          pendingCloses: {},
          pendingReleases: {
            0: {
              ...emptyPendingReleaseItem,
              revision: createMockRevision({ revision: 1, architectures: ["abc42"] }),
              channel: "test/edge",
            },
          },
        };

        const result = reducer(stateWithPendingRevision, setProgressiveRelease(progressive));
        const pr = findPendingRelease(result, 1);
        expect(pr!.progressive).toBeUndefined();
      });
    });

    describe("when there are pending releases with previousReleases", () => {
      const stateWithPreviousReleases: PendingChangesState = {
        changeOrderIndex: 1,
        pendingCloses: {},
        pendingReleases: {
          0: {
            ...emptyPendingReleaseItem,
            revision: createMockRevision({ revision: 1, architectures: ["abc42", "test64"] }),
            channel: "test/edge",
            previousReleases: [
              createMockRevision({ revision: 0, architectures: ["abc42"] }),
            ],
          },
        },
      };

      it("should add progressive state to the pending release", () => {
        const result = reducer(stateWithPreviousReleases, setProgressiveRelease(progressive));
        const pr = findPendingRelease(result, 1);
        expect(pr!.progressive).toEqual(progressive);
      });
    });

    describe("when pending releases already have progressive state", () => {
      it("should not update existing progressive state", () => {
        const existingProgressive: Progressive = {
          "current-percentage": 10,
          percentage: 20,
          paused: null,
        };
        const stateWithProgressiveRelease: PendingChangesState = {
          changeOrderIndex: 1,
          pendingCloses: {},
          pendingReleases: {
            0: {
              ...emptyPendingReleaseItem,
              revision: createMockRevision({ revision: 1, architectures: ["abc42", "test64"] }),
              channel: "test/edge",
              progressive: existingProgressive,
            },
          },
        };

        const result = reducer(stateWithProgressiveRelease, setProgressiveRelease(progressive));
        const pr = findPendingRelease(result, 1);
        expect(pr!.progressive).toEqual(existingProgressive);
      });
    });
  });

  // ─── updateProgressiveRelease ───────────────────────────────────────────────

  describe("on pendingChanges/updateProgressiveRelease action", () => {
    const newProgressive: Progressive = {
      "current-percentage": 10,
      percentage: 50,
      paused: null,
    };

    describe("when state is empty", () => {
      it("should not affect empty state", () => {
        const result = reducer(initialState, updateProgressiveRelease(newProgressive));
        expect(result.pendingReleases).toEqual({});
      });
    });

    describe("when pending releases have no progressive state", () => {
      it("should not change them", () => {
        const stateWithoutProgressive: PendingChangesState = {
          changeOrderIndex: 1,
          pendingCloses: {},
          pendingReleases: {
            0: {
              ...emptyPendingReleaseItem,
              revision: createMockRevision({ revision: 1 }),
              channel: "test/edge",
            },
          },
        };

        const result = reducer(stateWithoutProgressive, updateProgressiveRelease(newProgressive));
        const pr = findPendingRelease(result, 1);
        expect(pr!.progressive).toBeUndefined();
      });
    });

    describe("when pending releases have progressive state", () => {
      it("should update the progressive percentage", () => {
        const stateWithProgressive: PendingChangesState = {
          changeOrderIndex: 1,
          pendingCloses: {},
          pendingReleases: {
            0: {
              ...emptyPendingReleaseItem,
              revision: createMockRevision({ revision: 1 }),
              channel: "test/edge",
              progressive: {
                "current-percentage": null,
                percentage: 10,
                paused: null,
              },
            },
          },
        };

        const result = reducer(stateWithProgressive, updateProgressiveRelease(newProgressive));
        const pr = findPendingRelease(result, 1);
        expect(pr).toBeDefined();
        expect(pr!.progressive!.percentage).toEqual(50);
        expect(pr!.progressive!["current-percentage"]).toEqual(10);
      });
    });
  });

  // ─── releaseRevision thunk ──────────────────────────────────────────────────

  describe("releaseRevision thunk", () => {
    const revision = {
      revision: 1,
      architectures: ["test64"],
    } as unknown as Revision;
    const channel = "test/edge";

    it("should dispatch addPendingRelease with empty previousReleases when none exist", () => {
      const dispatch = vi.fn() as unknown as AppDispatch;
      const getState = () =>
        ({
          revisions: { 1: revision },
          pendingChanges: initialState,
          releases: [],
        }) as unknown as RootState;

      vi.mocked(getReleases).mockReturnValue([]);

      releaseRevision(revision, channel)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith(
        addPendingRelease(
          expect.objectContaining({ revision, channel, previousReleases: [] }),
        ),
      );
    });

    it("should include progressive state when previous releases exist", () => {
      const previousRevision = { revision: 2, architectures: ["test64"] } as unknown as Revision;
      const dispatch = vi.fn() as unknown as AppDispatch;
      const getState = () =>
        ({
          revisions: { 1: revision, 2: previousRevision },
          pendingChanges: initialState,
          releases: [{ architecture: "test64", channel, revision: 2 }],
        }) as unknown as RootState;

      const mockedRelease = createMockRelease({ architecture: "test64", channel, revision: 1 });
      vi.mocked(getReleases).mockReturnValue([mockedRelease]);

      releaseRevision(revision, channel)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith(
        addPendingRelease(
          expect.objectContaining({
            previousReleases: expect.arrayContaining([revision]),
          }),
        ),
      );
      expect(dispatch).toHaveBeenCalledWith(
        addPendingRelease(
          expect.objectContaining({
            progressive: expect.objectContaining({ percentage: 100 }),
          }),
        ),
      );
    });
  });

  // ─── promoteRevision thunk ──────────────────────────────────────────────────

  describe("promoteRevision thunk", () => {
    const revision = {
      revision: 1,
      architectures: ["test64"],
    } as unknown as Revision;
    const channel = "test/edge";

    describe("when nothing is released yet", () => {
      it("should dispatch releaseRevision", () => {
        const dispatch = vi.fn() as unknown as AppDispatch;
        const getState = () => ({} as RootState);

        vi.mocked(getPendingChannelMap).mockReturnValue({});

        promoteRevision(revision, channel)(dispatch, getState);

        expect(dispatch).toHaveBeenCalled();
      });
    });

    describe("when revision is already released in this arch and channel", () => {
      it("should not dispatch anything", () => {
        const dispatch = vi.fn() as unknown as AppDispatch;
        const getState = () => ({} as RootState);

        vi.mocked(getPendingChannelMap).mockReturnValue({
          [channel]: { test64: revision },
        });

        promoteRevision(revision, channel)(dispatch, getState);

        expect(dispatch).not.toHaveBeenCalled();
      });
    });
  });

  // ─── promoteChannel thunk ───────────────────────────────────────────────────

  describe("promoteChannel thunk", () => {
    const sourceChannel = "test/edge";
    const targetChannel = "test/stable";

    describe("when nothing is in the source channel", () => {
      it("should not dispatch anything", () => {
        const dispatch = vi.fn() as unknown as AppDispatch;
        const getState = () => ({} as RootState);

        vi.mocked(getPendingChannelMap).mockReturnValue({});

        promoteChannel(sourceChannel, targetChannel)(dispatch, getState);

        expect(dispatch).not.toHaveBeenCalled();
      });
    });

    describe("when revisions are in the source channel", () => {
      it("should dispatch for each revision in the source channel", () => {
        const revision1 = { revision: 1, architectures: ["test64"] } as unknown as Revision;
        const revision2 = { revision: 2, architectures: ["abc42"] } as unknown as Revision;
        const dispatch = vi.fn() as unknown as AppDispatch;
        const getState = () => ({} as RootState);

        vi.mocked(getPendingChannelMap).mockReturnValue({
          [sourceChannel]: { test64: revision1, abc42: revision2 },
        });
        // second call (inside promoteRevision) should return empty map
        vi.mocked(getPendingChannelMap).mockReturnValueOnce({
          [sourceChannel]: { test64: revision1, abc42: revision2 },
        }).mockReturnValue({});

        promoteChannel(sourceChannel, targetChannel)(dispatch, getState);

        expect(dispatch).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ─── undoRelease thunk ──────────────────────────────────────────────────────

  describe("undoRelease thunk", () => {
    const revision = {
      revision: 1,
      architectures: ["test64"],
    } as unknown as Revision;
    const channel = "test/edge";

    it("should trigger a GA event", () => {
      const dispatch = vi.fn() as unknown as AppDispatch;
      // simplification of the triggerGAEvent thunk return value to make testing easier
      const mockGAEvent = { type: "analytics/triggerGAEvent" };
      vi.spyOn(analytics, "triggerGAEvent")
        .mockReturnValue(mockGAEvent as any);

      undoRelease(revision, channel)(dispatch);

      expect(analytics.triggerGAEvent).toHaveBeenCalledWith(
        "click-cancel-promotion",
        "test/edge/test64",
      );
      expect(dispatch).toHaveBeenCalledWith(mockGAEvent);
    });

    it("should dispatch removePendingRelease with the given revision and channel", () => {
      const dispatch = vi.fn() as unknown as AppDispatch;

      undoRelease(revision, channel)(dispatch);

      expect(dispatch).toHaveBeenCalledWith(removePendingRelease({ revision, channel }));
    });
  });

  // ─── closeChannel thunk ─────────────────────────────────────────────────────

  describe("closeChannel thunk", () => {
    it("should add channel to pending closes", () => {
      const store = makeStore();
      store.dispatch(closeChannel("test/edge"));
      expect(Object.values(store.getState().pendingChanges.pendingCloses)).toContain(
        "test/edge",
      );
      expect(store.getState().pendingChanges.changeOrderIndex).toEqual(1);
    });

    it("should not add duplicate channel to pending closes", () => {
      const store = makeStore();
      store.dispatch(closeChannel("test/edge"));
      store.dispatch(closeChannel("test/edge"));
      const closes = Object.values(store.getState().pendingChanges.pendingCloses);
      expect(closes.filter((c) => c === "test/edge")).toHaveLength(1);
    });

    it("should remove pending releases to the same channel", () => {
      const store = makeStore();
      const revision = { revision: 1, architectures: ["test64"] } as unknown as Revision;
      store.dispatch(addPendingRelease({ revision, channel: "test/edge" }));
      store.dispatch(closeChannel("test/edge"));
      const pr = findPendingRelease(store.getState().pendingChanges, 1);
      expect(pr).toBeUndefined();
    });

    it("should close the history panel", () => {
      const store = makeStore();
      store.dispatch(closeChannel("test/edge"));
      expect(store.getState().history.isOpen).toBe(false);
    });
  });

  // ─── closeRevision thunk ────────────────────────────────────────────────────

  describe("closeRevision thunk", () => {
    const revision = {
      revision: 1,
      architectures: ["test64"],
    } as unknown as Revision;
    const channel = "test/edge";
    const arch = "test64" as CPUArchitecture;

    const closeRevisionAndGetDispatch = (channelMap = {}) => {
      const dispatch = vi.fn() as unknown as AppDispatch;
      const getState = () => ({} as RootState);
      vi.mocked(getPendingChannelMap).mockReturnValue(channelMap as any);
      closeRevision(revision, channel, arch)(dispatch, getState);
      return dispatch;
    };

    const extractProceed = (dispatch: AppDispatch) =>
      // the dispatch to open the modal contains the proceed function we want to test
      (dispatch as ReturnType<typeof vi.fn>).mock.calls[0][0].payload.actions[0]
        .onClickAction.reduxAction as () => void;

    describe("dispatched modal", () => {
      it("should dispatch openModal", () => {
        const dispatch = closeRevisionAndGetDispatch();
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect((dispatch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({
          type: "modal/openModal",
        });
      });

      it("should set the modal title to 'Attention'", () => {
        const dispatch = closeRevisionAndGetDispatch();
        expect((dispatch as ReturnType<typeof vi.fn>).mock.calls[0][0].payload.title).toBe(
          "Attention",
        );
      });

      it("should include arch and channel in the modal content", () => {
        const dispatch = closeRevisionAndGetDispatch();
        const content: string =
          (dispatch as ReturnType<typeof vi.fn>).mock.calls[0][0].payload.content;
        expect(content).toContain(arch);
        expect(content).toContain(channel);
      });

      it("should provide Continue and Cancel actions", () => {
        const dispatch = closeRevisionAndGetDispatch();
        const actions =
          (dispatch as ReturnType<typeof vi.fn>).mock.calls[0][0].payload.actions;
        expect(actions).toHaveLength(2);
        expect(actions[0].label).toBe("Continue");
        expect(actions[1].label).toBe("Cancel");
      });

      it("should wire the Cancel action to close the modal", () => {
        const dispatch = closeRevisionAndGetDispatch();
        const cancelAction =
          (dispatch as ReturnType<typeof vi.fn>).mock.calls[0][0].payload.actions[1];
        expect(cancelAction.onClickAction).toEqual({ type: CLOSE_MODAL_ACTION_NAME });
      });
    });

    describe("when the Continue action is executed (proceed)", () => {
      it("should dispatch closeChannel for the given channel", () => {
        const dispatch = closeRevisionAndGetDispatch();
        extractProceed(dispatch)();
        const calls = (dispatch as ReturnType<typeof vi.fn>).mock.calls;
        expect(calls.length).toBeGreaterThan(1);
        const closeChannelThunk = calls[1][0] as unknown as ReturnType<typeof closeChannel>;
        // check that closeChannel is called with the appropriate parameter
        expect(typeof closeChannelThunk).toBe("function");
        const store = makeStore();
        store.dispatch(closeChannelThunk);
        expect(Object.values(store.getState().pendingChanges.pendingCloses))
          .toContain(channel);
      });

      it("should dispatch closeModal", () => {
        const dispatch = closeRevisionAndGetDispatch();
        extractProceed(dispatch)();
        expect(dispatch).toHaveBeenCalledWith(closeModal());
      });

      describe("when there are other revisions in the channel", () => {
        it("should re-release those revisions", () => {
          const otherRevision = {
            revision: 2,
            architectures: ["abc42"],
          } as unknown as Revision;
          const dispatch = closeRevisionAndGetDispatch({
            [channel]: { test64: revision, abc42: otherRevision },
          });

          vi.mocked(getReleases).mockReturnValue([]);

          extractProceed(dispatch)();
          const calls = (dispatch as ReturnType<typeof vi.fn>).mock.calls;
          // openModal + closeChannel thunk + releaseRevision thunk + closeModal
          expect(calls.length).toBe(4);
          const releaseRevisionThunk = calls[2][0] as unknown as ReturnType<typeof releaseRevision>;
          expect(typeof releaseRevisionThunk).toBe("function");
          const store = makeStore();
          store.dispatch(releaseRevisionThunk);
          const pendingReleases = Object.values(store.getState().pendingChanges.pendingReleases);
          expect(pendingReleases).toHaveLength(1);
          expect(pendingReleases[0].channel).toBe("test/edge");
          expect(pendingReleases[0].revision.revision).toBe(2);
          expect(pendingReleases[0].revision.architectures).toContainEqual("abc42");
        });

        it("should not re-release the revision being closed", () => {
          const otherRevision = {
            revision: 2,
            architectures: ["abc42"],
          } as unknown as Revision;
          const dispatch = closeRevisionAndGetDispatch({
            [channel]: { test64: revision, abc42: otherRevision },
          });

          vi.mocked(getReleases).mockReturnValue([]);

          extractProceed(dispatch)();
          const calls = (dispatch as ReturnType<typeof vi.fn>).mock.calls;
          // openModal + closeChannel thunk + releaseRevision thunk + closeModal
          expect(calls.length).toBe(4);
          const thunkCalls = calls.filter((args: any[]) => typeof args[0] === "function")
            .map((args) => args[0]);
          // closeChannel + releaseRevision
          expect(thunkCalls).toHaveLength(2);
          // check that the releaseRevision is otherRevision
          const store = makeStore();
          thunkCalls.forEach((thunk) => store.dispatch(thunk));
          const pendingReleases = Object.values(store.getState().pendingChanges.pendingReleases);
          expect(pendingReleases).not.toEqual(
            expect.arrayContaining([
              expect.objectContaining({ revision: expect.objectContaining({ revision: 1 }) })
            ])
          );
        });
      });

      describe("when the revision is the only one in the channel", () => {
        it("should not dispatch releaseRevision for any other revisions", () => {
          const dispatch = closeRevisionAndGetDispatch({ [channel]: { test64: revision } });
          extractProceed(dispatch)();
          const calls = (dispatch as ReturnType<typeof vi.fn>).mock.calls;
          // openModal + closeChannel thunk + closeModal
          expect(calls.length).toBe(3);
          const thunkCalls = calls.filter((args: any[]) => typeof args[0] === "function")
            .map((args) => args[0]);
          // check releaseRevision has never been called
          const store = makeStore();
          thunkCalls.forEach((thunk) => store.dispatch(thunk));
          const pendingReleases = Object.values(store.getState().pendingChanges.pendingReleases);
          expect(pendingReleases).toHaveLength(0);
        });
      });
    });
  });
});
