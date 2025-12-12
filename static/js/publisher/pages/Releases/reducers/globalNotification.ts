import { ReleasesReduxState } from "../../../types/releaseTypes";
import {
  SHOW_NOTIFICATION,
  HIDE_NOTIFICATION,
  ShowNotificationAction,
  HideNotificationAction,
  NotificationAction,
} from "../actions/globalNotification";

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
