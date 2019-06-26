import { OPEN_MODAL, CLOSE_MODAL } from "../actions/modal";

export default function modal(state = {visible: true}, action) {
  switch (action.type) {
    case OPEN_MODAL:
      return {
        ...state,
        visible: true,
        ...action.payload
      };
    case CLOSE_MODAL:
      return {
        ...state,
        visible: false
      };
    default:
      return state;
  }
}
