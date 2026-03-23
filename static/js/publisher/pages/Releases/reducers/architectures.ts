import {
  UPDATE_ARCHITECTURES,
} from "../actions/architectures";
import { ReleasesReduxState } from "../../../types/releaseTypes";
import { RootAction } from "../actions";

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
