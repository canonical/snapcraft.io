import { UPDATE_RELEASES } from "../actions/releases";
import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

export type UpdateReleasesAction = GenericReleasesAction<
  typeof UPDATE_RELEASES,
  { releases: ReleasesReduxState["releases"] }
>;

export type ReleasesAction = UpdateReleasesAction;

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
