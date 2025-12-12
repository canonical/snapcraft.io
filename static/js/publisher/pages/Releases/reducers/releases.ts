import { ReleasesAction, UPDATE_RELEASES } from "../actions/releases";
import {
  ReleasesReduxState,
} from "../../../types/releaseTypes";

export default function releases(
  state: ReleasesReduxState["releases"] = [],
  action: ReleasesAction
) {
  switch (action.type) {
    case UPDATE_RELEASES:
      return [...action.payload.releases];
    default:
      return state;
  }
}
