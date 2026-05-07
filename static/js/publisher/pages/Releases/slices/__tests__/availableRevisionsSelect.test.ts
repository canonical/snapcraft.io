import { UnknownAction } from "@reduxjs/toolkit";
import reducer, {
  setAvailableRevisionsSelect,
  selectAvailableRevisions,
} from "../availableRevisionsSelect";
import { clearSelectedRevisions, selectRevision } from "../channelMap";
import {
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_ALL,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
} from "../../constants";
import type { AvailableRevisionsSelect, Revision } from "../../../../types/releaseTypes";
import type { AppDispatch, RootState } from "../../store";

vi.mock("../../selectors", () => ({
  getArchitectures: vi.fn(),
  getFilteredAvailableRevisions: vi.fn(),
  getFilteredAvailableRevisionsForArch: vi.fn(),
}));

import {
  getArchitectures,
  getFilteredAvailableRevisions,
  getFilteredAvailableRevisionsForArch,
} from "../../selectors";

describe("availableRevisionsSelect", () => {
  it("should return the initial state", () => {
    expect(
      reducer(undefined, {} as UnknownAction)
    ).toEqual(AVAILABLE_REVISIONS_SELECT_UNRELEASED);
  });

  describe("on availableRevisionsSelect/setAvailableRevisionsSelect action", () => {
    it("should update availableRevisionsSelect state", () => {
      const action = setAvailableRevisionsSelect(AVAILABLE_REVISIONS_SELECT_ALL);
      const result = reducer(AVAILABLE_REVISIONS_SELECT_UNRELEASED, action);
      expect(result).toEqual(AVAILABLE_REVISIONS_SELECT_ALL);
    });
  });

  describe("selectAvailableRevisions", () => {
    let dispatch: AppDispatch;
    const getState = vi.fn().mockReturnValue({} as RootState);

    beforeEach(() => {
      dispatch = vi.fn() as unknown as AppDispatch;
      vi.mocked(getArchitectures).mockReturnValue([]);
      vi.mocked(getFilteredAvailableRevisions).mockReturnValue([]);
      vi.mocked(getFilteredAvailableRevisionsForArch).mockReturnValue([]);
    });

    it("should dispatch setAvailableRevisionsSelect action", () => {
      const value: AvailableRevisionsSelect = AVAILABLE_REVISIONS_SELECT_ALL;
      selectAvailableRevisions(value)(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith(setAvailableRevisionsSelect(value));
    });

    it("should dispatch clearSelectedRevisions action", () => {
      const value: AvailableRevisionsSelect = AVAILABLE_REVISIONS_SELECT_ALL;
      selectAvailableRevisions(value)(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith(clearSelectedRevisions());
    });

    describe("when architectures and revisions are available", () => {
      const revision1 = {
        revision: 1,
        architectures: ["test64", "abc42"],
        version: "0.2.0",
      } as unknown as Revision;
      const revision2 = {
        revision: 2,
        architectures: ["test64", "amd42"],
        version: "0.3.0",
      } as unknown as Revision;

      beforeEach(() => {
        vi.mocked(getArchitectures).mockReturnValue(["abc42", "amd42", "test64"]);
        vi.mocked(getFilteredAvailableRevisions).mockImplementation(
          (state) => [revision2, revision1]);
        vi.mocked(getFilteredAvailableRevisionsForArch).mockImplementation(
          (_state, arch) => {
            if (arch === "test64") return [revision2, revision1];
            if (arch === "amd42" || arch === "abc42") return [revision1];
            return [];
          },
        );
      });

      it("should dispatch selectRevision for the latest revision in each arch where it is available", () => {
        selectAvailableRevisions(AVAILABLE_REVISIONS_SELECT_ALL)(dispatch, getState);
        expect(dispatch).toHaveBeenCalledWith(selectRevision(revision2));
      });

      it("should not dispatch selectRevision for arches without the latest revision", () => {
        selectAvailableRevisions(AVAILABLE_REVISIONS_SELECT_ALL)(dispatch, getState);
        const selectRevisionCalls = (dispatch as ReturnType<typeof vi.fn>).mock.calls
          // get first and only parameter of each call to dispatch, which is the action passed
          .map((call) => call[0])
          .filter((action) =>  action.type === "channelMap/selectRevision");
        const selectedRevisions = selectRevisionCalls.map((a) => a.payload as unknown as Revision);
        // we should not find any revision with 
        expect(selectedRevisions.every(
            (rev) => rev.architectures.find((arch) => arch === "abc42") === undefined))
          .toBe(true);
      });
    });

    describe("when 'Recent' is selected", () => {
      const value = AVAILABLE_REVISIONS_SELECT_RECENT;

      describe("when there are no revisions", () => {
        it("should not dispatch any selectRevision actions", () => {
          vi.mocked(getArchitectures).mockReturnValue(["arch1"]);
          vi.mocked(getFilteredAvailableRevisions).mockReturnValue([]);
          vi.mocked(getFilteredAvailableRevisionsForArch).mockReturnValue([]);

          selectAvailableRevisions(value)(dispatch, getState);

          const selectRevisionCalls = (dispatch as ReturnType<typeof vi.fn>).mock.calls
            .map((call) => call[0])
            .filter((action) => action.type === "channelMap/selectRevision");
          expect(selectRevisionCalls).toHaveLength(0);
        });
      });

      describe("when there are revisions in state", () => {
        const revision1 = {
          revision: 1,
          version: "1",
          architectures: ["arch1"],
        } as unknown as Revision;
        const revision2 = {
          revision: 2,
          version: "2",
          architectures: ["arch2"],
        } as unknown as Revision;
        const revision3 = {
          revision: 3,
          version: "1",
          architectures: ["arch3"],
        } as unknown as Revision;

        beforeEach(() => {
          vi.mocked(getArchitectures).mockReturnValue(["arch1", "arch2", "arch3"]);
          // the method returns the revisions ordered by revision (higher version first)
          vi.mocked(getFilteredAvailableRevisions).mockReturnValue([revision3, revision2, revision1]);
          vi.mocked(getFilteredAvailableRevisionsForArch).mockImplementation(
            (_state, arch) => {
              if (arch === "arch1") return [revision1];
              if (arch === "arch2") return [revision2];
              if (arch === "arch3") return [revision3];
              return [];
            },
          );
        });

        it("should dispatch selectRevision for revisions with version equal to the newest revision", () => {
          selectAvailableRevisions(value)(dispatch, getState);
          expect(dispatch).toHaveBeenCalledWith(selectRevision(revision1));
          expect(dispatch).toHaveBeenCalledWith(selectRevision(revision3));
        });

        it("should not dispatch selectRevision for revisions with other versions", () => {
          selectAvailableRevisions(value)(dispatch, getState);
          expect(dispatch).not.toHaveBeenCalledWith(selectRevision(revision2));
        });
      });
    });

    describe("when 'Launchpad' is selected", () => {
      const value = AVAILABLE_REVISIONS_SELECT_LAUNCHPAD;

      describe("when there are no revisions", () => {
        it("should not dispatch any selectRevision actions", () => {
          vi.mocked(getArchitectures).mockReturnValue(["arch1"]);
          vi.mocked(getFilteredAvailableRevisions).mockReturnValue([]);
          vi.mocked(getFilteredAvailableRevisionsForArch).mockReturnValue([]);

          selectAvailableRevisions(value)(dispatch, getState);

          const selectRevisionCalls = (dispatch as ReturnType<typeof vi.fn>).mock.calls
            .map((call) => call[0])
            .filter((action) => action.type === "channelMap/selectRevision");
          expect(selectRevisionCalls).toHaveLength(0);
        });
      });

      describe("when there are revisions in state", () => {
        const revision1 = {
          revision: 1,
          architectures: ["arch1"],
          attributes: { "build-request-id": "lp-1" },
        } as unknown as Revision;
        const revision2 = {
          revision: 2,
          architectures: ["arch2"],
          attributes: { "build-request-id": "lp-2" },
        } as unknown as Revision;
        const revision3 = {
          revision: 3,
          architectures: ["arch3"],
          attributes: { "build-request-id": "lp-1" },
        } as unknown as Revision;

        beforeEach(() => {
          vi.mocked(getArchitectures).mockReturnValue(["arch1", "arch2", "arch3"]);
          vi.mocked(getFilteredAvailableRevisions).mockReturnValue([revision1, revision3, revision2]);
          vi.mocked(getFilteredAvailableRevisionsForArch).mockImplementation(
            (_state, arch) => {
              if (arch === "arch1") return [revision1];
              if (arch === "arch2") return [revision2];
              if (arch === "arch3") return [revision3];
              return [];
            },
          );
        });

        it("should dispatch selectRevision for revisions with the most recent build id", () => {
          selectAvailableRevisions(value)(dispatch, getState);
          expect(dispatch).toHaveBeenCalledWith(selectRevision(revision1));
          expect(dispatch).toHaveBeenCalledWith(selectRevision(revision3));
        });

        it("should not dispatch selectRevision for revisions with other build ids", () => {
          selectAvailableRevisions(value)(dispatch, getState);
          expect(dispatch).not.toHaveBeenCalledWith(selectRevision(revision2));
        });
      });
    });
  });
});
