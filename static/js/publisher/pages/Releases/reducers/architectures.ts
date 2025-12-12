import {
  UPDATE_ARCHITECTURES,
  UpdateArchitecturesAction,
  ArchitecturesAction,
} from "../actions/architectures";
import { ReleasesReduxState } from "../../../types/releaseTypes";

export default function architectures(
  state: ReleasesReduxState["architectures"] = [],
  action: ArchitecturesAction
) {
  switch (action.type) {
    case UPDATE_ARCHITECTURES:
      return [...action.payload.architectures];
    default:
      return state;
  }
}
