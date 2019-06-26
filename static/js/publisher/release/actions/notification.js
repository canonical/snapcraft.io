export const SHOW_NOTIFICATION = "SHOW_NOTIFICATION";
export const HIDE_NOTIFICATION = "HIDE_NOTIFICATION";

export function showNotification(payload) {
  return {
    type: SHOW_NOTIFICATION,
    payload: { payload }
  };
}

export function hideNotification() {
  return {
    type: HIDE_NOTIFICATION
  };
}
