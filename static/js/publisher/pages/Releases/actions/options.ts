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

export type OptionsAction = ReleasesReadyAction;
