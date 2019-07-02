import modal from "./modal";

import { OPEN_MODAL, CLOSE_MODAL } from "../actions/modal";

describe("modal", () => {
  it("should return the initial state", () => {
    expect(modal(undefined, {})).toEqual({
      visible: false
    });
  });

  describe("on OPEN_MODAL action", () => {
    let openModalAction = {
      type: OPEN_MODAL,
      payload: {
        title: "Modal title",
        content: "Modal content",
        actions: [],
        closeModal: () => {}
      }
    };

    it("should mark modal as visible", () => {
      const result = modal({}, openModalAction);

      expect(result.visible).toBe(true);
      expect(result).toEqual({
        ...openModalAction.payload,
        visible: true
      });
    });
  });

  describe("on CLOSE_MODAL action", () => {
    let closeModalAction = {
      type: CLOSE_MODAL
    };

    it("should mark the modal as not visible", () => {
      const result = modal({}, closeModalAction);

      expect(result.visible).toBe(false);
    });
  });
});
