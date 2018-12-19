import availableSelect from "./availableSelect";
import { SET_AVAILABLE_SELECT } from "../actions/availableSelect";
import { AVAILABLE_SELECT_UNRELEASED } from "../constants";

describe("releases", () => {
  it("should return the initial state", () => {
    expect(availableSelect(undefined, {})).toEqual(AVAILABLE_SELECT_UNRELEASED);
  });

  describe("on SET_AVAILABLE_SELECT action", () => {
    let setSelectAction = {
      type: SET_AVAILABLE_SELECT,
      payload: {
        value: "test"
      }
    };

    it("should set new value in state", () => {
      const result = availableSelect("", setSelectAction);

      expect(result).toEqual(setSelectAction.payload.value);
    });
  });
});
