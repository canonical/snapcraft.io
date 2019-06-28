import {
  SHOW_NOTIFICATION,
  HIDE_NOTIFICATION,
  showNotification,
  hideNotification
} from "./notification";

describe("notification actions", () => {
  describe("showNotification", () => {
    it("should create an action to show notification", () => {
      const showNotificationAction = showNotification({ status: "success" });

      expect(showNotificationAction.type).toBe(SHOW_NOTIFICATION);
      expect(showNotificationAction.payload).toEqual({
        payload: {
          status: "success"
        }
      });
    });
  });

  describe("closeNotification", () => {
    it("should create an action to hide the notification", () => {
      const hideNotificationAction = hideNotification();

      expect(hideNotificationAction.type).toBe(HIDE_NOTIFICATION);
      expect(hideNotificationAction.paylaod).toBeUndefined();
    });
  });
});
