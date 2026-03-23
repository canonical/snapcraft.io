import { ReleasesReduxState } from "../../../types/releaseTypes";
import { RootAction } from "../actions";
import {
  SHOW_NOTIFICATION,
  HIDE_NOTIFICATION,
} from "../actions/globalNotification";

export default function notification(
  state: ReleasesReduxState["notification"] = { visible: false },
  action: RootAction
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
