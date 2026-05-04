import { UnknownAction } from "@reduxjs/toolkit";
import reducer, { showNotification, hideNotification } from "../notification";
import type { NotificationState } from "../../../../types/releaseTypes";

describe("notification", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {} as UnknownAction)).toEqual({ visible: false });
  });

  describe("on notification/showNotification action", () => {
    const notificationPayload: NotificationState = {
      status: "success",
      appearance: "positive",
      content: "Notification content",
      canDismiss: false,
      visible: false,
    };

    it("should mark notification as visible", () => {
      const result = reducer({} as NotificationState, showNotification(notificationPayload));
      expect(result.visible).toBe(true);
    });

    it("should include the payload data in state", () => {
      const result = reducer({} as NotificationState, showNotification(notificationPayload));
      expect(result).toEqual({ ...notificationPayload, visible: true });
    });
  });

  describe("on notification/hideNotification action", () => {
    it("should mark the notification as not visible", () => {
      const result = reducer({} as NotificationState, hideNotification());
      expect(result.visible).toBe(false);
    });
  });
});
