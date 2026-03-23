import { AVAILABLE_REVISIONS_SELECT_UNRELEASED } from "../constants";
import {
  SET_AVAILABLE_REVISIONS_SELECT,
} from "../actions/availableRevisionsSelect";
import { ReleasesReduxState } from "../../../types/releaseTypes";
import { RootAction } from "../actions";

export default function availableRevisionsSelect(
  state: ReleasesReduxState["availableRevisionsSelect"] = AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  action: RootAction
) {
  switch (action.type) {
    case SET_AVAILABLE_REVISIONS_SELECT:
      return action.payload.value;
    default:
      return state;
  }
}
