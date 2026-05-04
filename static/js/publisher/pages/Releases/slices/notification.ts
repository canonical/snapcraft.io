import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { NotificationState } from "../../../types/releaseTypes";

const notificationSlice = createSlice({
  name: "notification",
  initialState: { visible: false } as NotificationState,
  reducers: {
    showNotification(_state, action: PayloadAction<NotificationState>) {
      return { ...action.payload, visible: true };
    },
    hideNotification(state) {
      state.visible = false;
    },
  }
});

export const { showNotification, hideNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
