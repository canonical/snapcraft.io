import { ReleasesReduxState } from "../../../types/releaseTypes";
import { RootAction } from "../actions";
import {
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
    default:
      return state;
  }
}
