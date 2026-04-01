import { UPDATE_RELEASES } from "../actions/releases";
import type {
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import type { RootAction } from "../actions";

export default function releases(
  state: ReleasesReduxState["releases"] = [],
  action: RootAction
) {
  switch (action.type) {
    case UPDATE_RELEASES:
      return [...action.payload.releases];
    default:
      return state;
  }
}
