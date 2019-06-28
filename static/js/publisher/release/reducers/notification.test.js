import notification from "./notification";

import { SHOW_NOTIFICATION, HIDE_NOTIFICATION } from "../actions/notification";

describe("notification", () => {
  it("should return the initial state", () => {
    expect(notification(undefined, {})).toEqual({
      visible: false
    });
  });

  describe("on SHOW_NOTIFICATON action", () => {
    let showNotificationAction = {
      type: SHOW_NOTIFICATION,
      payload: {
        status: "success",
        appearance: "positive",
        content: "Notification content",
        canDismiss: false
      }
    };

    it("should mark notification as visible", () => {
      const result = notification({}, showNotificationAction);

      expect(result.visible).toBe(true);
      expect(result).toEqual({
        ...showNotificationAction.payload,
        visible: true
      });
    });
  });

  describe("on HIDE_NOTIFICATION action", () => {
    let hideNotificationAction = {
      type: HIDE_NOTIFICATION
    };

    it("should mark the notification as not visible", () => {
      const result = notification({}, hideNotificationAction);

      expect(result.visible).toBe(false);
      expect(result.payload).toBeUndefined();
    });
  });
});
