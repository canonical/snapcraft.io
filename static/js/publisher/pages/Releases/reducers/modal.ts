import { ReleasesReduxState } from "../../../types/releaseTypes";
import {
  OPEN_MODAL,
  CLOSE_MODAL,
  OpenModalAction,
  CloseModalAction,
  ModalAction,
} from "../actions/modal";

export default function modal(
  state: ReleasesReduxState["modal"] = { visible: false },
  action: ModalAction
) {
  switch (action.type) {
    case OPEN_MODAL:
      return {
        ...state,
        visible: true,
        ...action.payload,
      };
    case CLOSE_MODAL:
      return {
        ...state,
        visible: false,
      };
    default:
      return state;
  }
}
