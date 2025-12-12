import notification from "../globalNotification";
import {
  HideNotificationAction,
  NotificationAction,
  ShowNotificationAction,
} from "../../actions/globalNotification";

import {
  SHOW_NOTIFICATION,
  HIDE_NOTIFICATION,
} from "../../actions/globalNotification";

describe("notification", () => {
  it("should return the initial state", () => {
    expect(notification(undefined, {} as NotificationAction)).toEqual({
      visible: false,
    });
  });

  describe("on SHOW_NOTIFICATON action", () => {
    let showNotificationAction: ShowNotificationAction = {
      type: SHOW_NOTIFICATION,
      payload: {
        status: "success",
        appearance: "positive",
        content: "Notification content",
        canDismiss: false,
      },
    };

    it("should mark notification as visible", () => {
      const result = notification({}, showNotificationAction);

      expect(result.visible).toBe(true);
      expect(result).toEqual({
        ...showNotificationAction.payload,
        visible: true,
      });
    });
  });

  describe("on HIDE_NOTIFICATION action", () => {
    let hideNotificationAction: HideNotificationAction = {
      type: HIDE_NOTIFICATION,
    };

    it("should mark the notification as not visible", () => {
      const result = notification({}, hideNotificationAction);

      expect(result.visible).toBe(false);
    });
  });
});
