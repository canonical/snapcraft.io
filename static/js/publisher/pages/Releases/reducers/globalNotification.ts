import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import {
  SHOW_NOTIFICATION,
  HIDE_NOTIFICATION,
} from "../actions/globalNotification";

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

export default function notification(
  state: ReleasesReduxState["notification"] = { visible: false },
  action: NotificationAction
) {
  switch (action.type) {
    case SHOW_NOTIFICATION:
      return {
        ...state,
        visible: true,
        ...action.payload,
      };
    case HIDE_NOTIFICATION:
      return {
        ...state,
        visible: false,
      };
    default:
      return state;
  }
}
