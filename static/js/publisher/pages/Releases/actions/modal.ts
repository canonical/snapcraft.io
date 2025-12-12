import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

export const OPEN_MODAL = "OPEN_MODAL";
export const CLOSE_MODAL = "CLOSE_MODAL";

export type OpenModalAction = GenericReleasesAction<
  typeof OPEN_MODAL,
  Partial<ReleasesReduxState["modal"]>
>;

export type CloseModalAction = GenericReleasesAction<typeof CLOSE_MODAL, never>;

export type ModalAction = OpenModalAction | CloseModalAction;

export function openModal(
  payload: Partial<ReleasesReduxState["modal"]>
): OpenModalAction {
  return {
    type: OPEN_MODAL,
    payload,
  };
}

export function closeModal(): CloseModalAction {
  return {
    type: CLOSE_MODAL,
  };
}
