import {
  SET_AVAILABLE_REVISIONS_SELECT,
  setAvailableRevisionsSelect
} from "./availableRevisionsSelect";

describe("availableRevisionsSelect actions", () => {
  describe("setAvailableRevisionsSelect", () => {
    const value = "test";

    it("should create an action to set value of available revisions select", () => {
      expect(setAvailableRevisionsSelect(value).type).toBe(
        SET_AVAILABLE_REVISIONS_SELECT
      );
    });

    it("should supply a payload with a value to set", () => {
      expect(setAvailableRevisionsSelect(value).payload.value).toEqual(value);
    });
  });
});
