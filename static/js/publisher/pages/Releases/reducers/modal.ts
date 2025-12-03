import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { OPEN_MODAL, CLOSE_MODAL } from "../actions/modal";

export type OpenModalAction = GenericReleasesAction<
  typeof OPEN_MODAL,
  Partial<ReleasesReduxState["modal"]>
>;

export type CloseModalAction = GenericReleasesAction<typeof CLOSE_MODAL, never>;

export type ModalAction = OpenModalAction | CloseModalAction;

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
