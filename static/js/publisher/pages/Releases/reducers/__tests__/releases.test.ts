import releases, { ReleasesAction } from "../releases";
import { UPDATE_RELEASES } from "../../actions/releases";
import { ReleasesReduxState } from "../../../../types/releaseTypes";

describe("releases", () => {
  it("should return the initial state", () => {
    expect(releases(undefined, {} as ReleasesAction)).toEqual([]);
  });

  describe("on UPDATE_REVISIONS action", () => {
    let updateReleasesAction = {
      type: UPDATE_RELEASES,
      payload: {
        releases: [{ revision: 1 }, { revision: 2 }, { revision: 3 }],
      },
    } as ReleasesAction;

    it("should add new releases to state", () => {
      const result = releases([], updateReleasesAction);

      expect(result).toEqual(updateReleasesAction.payload.releases);
    });

    it("should replace existing releases in state", () => {
      const initialState = [
        { revision: 5 },
        { revision: 6 },
      ] as ReleasesReduxState["releases"];

      const result = releases(initialState, updateReleasesAction);

      expect(result).toEqual(updateReleasesAction.payload.releases);
    });
  });
});
