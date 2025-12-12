import modal from "../modal";
import { CloseModalAction, ModalAction, OpenModalAction } from "../../actions/modal";

import { OPEN_MODAL, CLOSE_MODAL } from "../../actions/modal";

describe("modal", () => {
  it("should return the initial state", () => {
    expect(modal(undefined, {} as ModalAction)).toEqual({
      visible: false,
    });
  });

  describe("on OPEN_MODAL action", () => {
    let openModalAction = {
      type: OPEN_MODAL,
      payload: {
        title: "Modal title",
        content: "Modal content",
        actions: [],
        closeModal: () => {},
      },
    } as OpenModalAction;

    it("should mark modal as visible", () => {
      const result = modal({}, openModalAction);

      expect(result.visible).toBe(true);
      expect(result).toEqual({
        ...openModalAction.payload,
        visible: true,
      });
    });
  });

  describe("on CLOSE_MODAL action", () => {
    let closeModalAction = {
      type: CLOSE_MODAL,
    } as CloseModalAction;

    it("should mark the modal as not visible", () => {
      const result = modal({}, closeModalAction);

      expect(result.visible).toBe(false);
    });
  });
});
