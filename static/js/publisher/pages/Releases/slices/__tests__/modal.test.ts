import { UnknownAction } from "@reduxjs/toolkit";
import reducer, { openModal, closeModal } from "../modal";
import type { ModalState } from "../../../../types/releaseTypes";

describe("modal", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual({ visible: false });
  });

  describe("on modal/openModal action", () => {
    const modalPayload = {
      title: "Modal title",
      content: "Modal content",
      actions: [],
      closeModal: () => {},
    } as unknown as ModalState;

    it("should mark modal as visible", () => {
      const result = reducer({} as ModalState, openModal(modalPayload));
      expect(result.visible).toBe(true);
    });

    it("should include the payload data in state", () => {
      const result = reducer({} as ModalState, openModal(modalPayload));
      expect(result).toEqual({ ...modalPayload, visible: true });
    });
  });

  describe("on modal/closeModal action", () => {
    it("should create an action to close the modal", () => {
      const result = reducer({} as ModalState, closeModal());
      expect(result.visible).toBe(false);
    });
  });
});
