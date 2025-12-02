import { UPDATE_ARCHITECTURES } from "../actions/architectures";
import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

export type UpdateArchitecturesAction = GenericReleasesAction<
  typeof UPDATE_ARCHITECTURES,
  {
    architectures: ReleasesReduxState["architectures"];
  }
>;

export type ArchitecturesAction = UpdateArchitecturesAction;

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
