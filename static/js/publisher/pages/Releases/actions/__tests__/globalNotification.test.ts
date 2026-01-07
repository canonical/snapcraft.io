import {
  SHOW_NOTIFICATION,
  HIDE_NOTIFICATION,
  showNotification,
  hideNotification,
} from "../globalNotification";

describe("notification actions", () => {
  describe("showNotification", () => {
    it("should create an action to show notification", () => {
      const showNotificationAction = showNotification({ status: "success" });

      expect(showNotificationAction.type).toBe(SHOW_NOTIFICATION);
      expect(showNotificationAction.payload).toEqual({
        status: "success",
      });
    });
  });

  describe("closeNotification", () => {
    it("should create an action to hide the notification", () => {
      const hideNotificationAction = hideNotification();

      expect(hideNotificationAction.type).toBe(HIDE_NOTIFICATION);
      // @ts-expect-error: we're checking that the payload doesn't exist
      expect(hideNotificationAction.payload).toBeUndefined();
    });
  });
});
