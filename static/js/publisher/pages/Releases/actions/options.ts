import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

export const RELEASES_READY = "RELEASES_READY";

export type ReleasesReadyAction = GenericReleasesAction<
  typeof RELEASES_READY,
  Partial<ReleasesReduxState["options"]>
>;

export function releasesReady(
  ready: boolean = true
): ReleasesReadyAction {
  return {
    type: RELEASES_READY,
    payload: {
      releasesReady: ready,
    },
  }
}

export const INIT_OPTIONS = "INIT_OPTIONS";

export type InitOptionsAction = GenericReleasesAction<
  typeof INIT_OPTIONS,
  ReleasesReduxState["options"]
>;

export function initOptions(
  options: ReleasesReduxState["options"]
): InitOptionsAction {
  return {
    type: INIT_OPTIONS,
    payload: options
  }
}

export type OptionsAction =
  | ReleasesReadyAction
  | InitOptionsAction;
