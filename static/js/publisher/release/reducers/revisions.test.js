import revisions from "./revisions";
import { UPDATE_REVISIONS } from "../actions/revisions";

describe("revisions", () => {
  it("should return the initial state", () => {
    expect(revisions(undefined, {})).toEqual({});
  });

  describe("on UPDATE_REVISIONS action", () => {
    let updateRevisionsAction = {
      type: UPDATE_REVISIONS,
      payload: {
        revisions: {
          1: { revision: 1 },
          2: { revision: 2 },
          3: { revision: 3, channels: ["stable"] }
        }
      }
    };

    it("should add revisions to state", () => {
      const result = revisions({}, updateRevisionsAction);

      expect(result).toEqual(updateRevisionsAction.payload.revisions);
    });

    it("should update existing revisions in state", () => {
      const initialState = {
        1: { revision: 1 },
        3: { revision: 3 }
      };

      const result = revisions(initialState, updateRevisionsAction);

      expect(result).toEqual(updateRevisionsAction.payload.revisions);
    });
  });
});
