import availableRevisionsSelect, {
  AvailableRevisionsSelectAction,
  SetAvailableRevisionsSelectAction,
} from "../availableRevisionsSelect";
import { SET_AVAILABLE_REVISIONS_SELECT } from "../../actions/availableRevisionsSelect";
import { AVAILABLE_REVISIONS_SELECT_UNRELEASED } from "../../constants";
import { AvailableRevisionsSelect } from "../../../../types/releaseTypes";

describe("releases", () => {
  it("should return the initial state", () => {
    expect(
      availableRevisionsSelect(undefined, {} as AvailableRevisionsSelectAction)
    ).toEqual(AVAILABLE_REVISIONS_SELECT_UNRELEASED);
  });

  describe("on SET_AVAILABLE_REVISIONS_SELECT action", () => {
    let setSelectAction: SetAvailableRevisionsSelectAction = {
      type: SET_AVAILABLE_REVISIONS_SELECT,
      payload: {
        value: "test",
      },
    };

    it("should set new value in state", () => {
      const result = availableRevisionsSelect(
        "" as AvailableRevisionsSelect,
        setSelectAction
      );

      expect(result).toEqual(setSelectAction.payload.value);
    });
  });
});
