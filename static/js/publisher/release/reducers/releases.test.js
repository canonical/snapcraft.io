import releases from "./releases";
import { UPDATE_RELEASES } from "../actions/releases";

describe("releases", () => {
  it("should return the initial state", () => {
    expect(releases(undefined, {})).toEqual([]);
  });

  describe("on UPDATE_REVISIONS action", () => {
    let updateReleasesAction = {
      type: UPDATE_RELEASES,
      payload: {
        releases: [{ revision: 1 }, { revision: 2 }, { revision: 3 }]
      }
    };

    it("should add new releases to state", () => {
      const result = releases({}, updateReleasesAction);

      expect(result).toEqual(updateReleasesAction.payload.releases);
    });

    it("should replace existing releases in state", () => {
      const initialState = [{ revision: 5 }, { revision: 6 }];

      const result = releases(initialState, updateReleasesAction);

      expect(result).toEqual(updateReleasesAction.payload.releases);
    });
  });
});
