import architectures from "../architectures";
import { UPDATE_ARCHITECTURES } from "../../actions/architectures";

describe("architectures", () => {
  it("should return the initial state", () => {
    expect(architectures(undefined, {})).toEqual([]);
  });

  describe("on UPDATE_ARCHITECTURES action", () => {
    let updateArchitecturesAction = {
      type: UPDATE_ARCHITECTURES,
      payload: {
        architectures: ["amd64", "armhf", "test", "test2"],
      },
    };

    it("should add architectures to state", () => {
      const result = architectures({}, updateArchitecturesAction);

      expect(result).toEqual(updateArchitecturesAction.payload.architectures);
    });

    it("should replace existing architectures in state", () => {
      const initialState = ["testing"];

      const result = architectures(initialState, updateArchitecturesAction);

      expect(result).toEqual(updateArchitecturesAction.payload.architectures);
    });
  });
});
