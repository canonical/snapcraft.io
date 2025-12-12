import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

export const SHOW_NOTIFICATION = "SHOW_NOTIFICATION";
export const HIDE_NOTIFICATION = "HIDE_NOTIFICATION";

export type ShowNotificationAction = GenericReleasesAction<
  typeof SHOW_NOTIFICATION,
  Partial<ReleasesReduxState["notification"]>
>;

export type HideNotificationAction = GenericReleasesAction<
  typeof HIDE_NOTIFICATION,
  never
>;

export type NotificationAction =
  | ShowNotificationAction
  | HideNotificationAction;

export function showNotification(
  payload: Partial<ReleasesReduxState["notification"]>
): ShowNotificationAction {
  return {
    type: SHOW_NOTIFICATION,
    payload,
  };
}

export function hideNotification(): HideNotificationAction {
  return {
    type: HIDE_NOTIFICATION,
  };
}
