import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  ModalState,
} from "../../../types/releaseTypes";

export const CLOSE_MODAL_ACTION_NAME = "modal/closeModal";

const modalSlice = createSlice({
  name: "modal",
  initialState: { visible: false } as ModalState,
  reducers: {
    openModal(_state, action: PayloadAction<ModalState>) {
      const modalProps = action.payload;
      modalProps.visible = true;
      return modalProps;
    },
    closeModal(state) {
      state.visible = false;
    },
  }
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
