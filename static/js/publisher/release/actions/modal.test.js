import { OPEN_MODAL, CLOSE_MODAL, openModal, closeModal } from "./modal";

describe("modal actions", () => {
  const dummyPayload = {
    title: "test"
  };

  describe("openModal", () => {
    it("should create an action to open the modal", () => {
      const modalAction = openModal(dummyPayload);
      expect(modalAction.type).toBe(OPEN_MODAL);
      expect(modalAction.payload).toEqual({ payload: dummyPayload });
    });
  });

  describe("closeModal", () => {
    it("should create an action to close the modal", () => {
      const modalAction = closeModal();
      expect(modalAction.type).toBe(CLOSE_MODAL);
      expect(modalAction.payload).toBeUndefined();
    });
  });
});
