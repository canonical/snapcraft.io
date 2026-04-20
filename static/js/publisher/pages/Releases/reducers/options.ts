import type { ReleasesReduxState } from "../../../types/releaseTypes";
import type { RootAction } from "../actions";
import {
  INIT_OPTIONS,
  RELEASES_READY,
} from "../actions/options";

export default function options(
  state: ReleasesReduxState["options"] = {
    flags: {},
    snapName: "",
    releasesReady: false,
  },
  action: RootAction
) {
  switch (action.type) {
    case RELEASES_READY:
      return {
        ...state,
        ...action.payload,
      };
    case INIT_OPTIONS:
      return {
        ...action.payload
      }
    default:
      return state;
  }
}
