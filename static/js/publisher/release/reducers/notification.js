import { SHOW_NOTIFICATION, HIDE_NOTIFICATION } from "../actions/notification";

export default function notification(state = {visible: false}, action) {
  switch (action.type) {
    case SHOW_NOTIFICATION:
      return {
        ...state,
        visible: true,
        ...action.payload
      };
    case HIDE_NOTIFICATION:
      return {
        ...state,
        visible: false
      };
    default:
      return state;
  }
}
