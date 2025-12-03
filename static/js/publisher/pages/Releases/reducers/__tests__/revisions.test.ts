import revisions, { RevisionsAction, UpdateRevisionsAction } from "../revisions";
import { UPDATE_REVISIONS } from "../../actions/revisions";
import { ReleasesReduxState } from "../../../../types/releaseTypes";

describe("revisions", () => {
  it("should return the initial state", () => {
    expect(revisions(undefined, {} as RevisionsAction)).toEqual({});
  });

  describe("on UPDATE_REVISIONS action", () => {
    let updateRevisionsAction = {
      type: UPDATE_REVISIONS,
      payload: {
        revisions: {
          1: { revision: 1 },
          2: { revision: 2 },
          3: { revision: 3, channels: ["stable"] },
        },
      },
    } as unknown as UpdateRevisionsAction;

    it("should add revisions to state", () => {
      const result = revisions({}, updateRevisionsAction);

      expect(result).toEqual(updateRevisionsAction.payload.revisions);
    });

    it("should update existing revisions in state", () => {
      const initialState = {
        1: { revision: 1 },
        3: { revision: 3 },
      } as unknown as ReleasesReduxState["revisions"];

      const result = revisions(initialState, updateRevisionsAction);

      expect(result).toEqual(updateRevisionsAction.payload.revisions);
    });
  });
});
