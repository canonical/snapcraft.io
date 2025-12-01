import {
  ReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import {
  SHOW_NOTIFICATION,
  HIDE_NOTIFICATION,
} from "../actions/globalNotification";

type NotificationAction = ReleasesAction & {
  payload: Partial<ReleasesReduxState["notification"]>;
};

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
