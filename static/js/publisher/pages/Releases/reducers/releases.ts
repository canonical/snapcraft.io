import { UPDATE_RELEASES } from "../actions/releases";
import {
  ReleasesAction as _ReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

type ReleasesAction = _ReleasesAction & {
  payload: { releases: ReleasesReduxState["releases"] };
};

export default function releases(
  state: ReleasesReduxState["releases"] = [],
  action: ReleasesAction
) {
  switch (action.type) {
    case UPDATE_RELEASES:
      return [ ...action.payload.releases ];
    default:
      return state;
  }
}
