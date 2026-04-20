import {
  UPDATE_ARCHITECTURES,
} from "../actions/architectures";
import type { ReleasesReduxState } from "../../../types/releaseTypes";
import type { RootAction } from "../actions";

export default function architectures(
  state: ReleasesReduxState["architectures"] = [],
  action: RootAction
) {
  switch (action.type) {
    case UPDATE_ARCHITECTURES:
      return [...action.payload.architectures];
    default:
      return state;
  }
}
