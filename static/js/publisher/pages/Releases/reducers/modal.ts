import {
  ReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { OPEN_MODAL, CLOSE_MODAL } from "../actions/modal";

type ModalAction = ReleasesAction & {
  payload: Partial<ReleasesReduxState["modal"]>;
};

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
