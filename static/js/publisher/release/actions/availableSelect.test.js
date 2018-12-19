import { SET_AVAILABLE_SELECT, setAvailableSelect } from "./availableSelect";

describe("availableSelect actions", () => {
  describe("setAvailableSelect", () => {
    const value = "test";

    it("should create an action to set value of available revisions select", () => {
      expect(setAvailableSelect(value).type).toBe(SET_AVAILABLE_SELECT);
    });

    it("should supply a payload with a value to set", () => {
      expect(setAvailableSelect(value).payload.value).toEqual(value);
    });
  });
});
