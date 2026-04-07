import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { NotificationState } from "../../../types/releaseTypes";

const notificationSlice = createSlice({
  name: "notification",
  initialState: { visible: false } as NotificationState,
  reducers: {
    showNotification(_state, action: PayloadAction<NotificationState>) {
      const notificationProps = action.payload;
      notificationProps.visible = true;
      return notificationProps;
    },
    hideNotification(state) {
      state.visible = false;
    },
  }
});

export const { showNotification, hideNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
