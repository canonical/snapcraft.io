import { AVAILABLE_REVISIONS_SELECT_UNRELEASED } from "../constants";
import {
  SET_AVAILABLE_REVISIONS_SELECT,
  SetAvailableRevisionsSelectAction,
  AvailableRevisionsSelectAction,
} from "../actions/availableRevisionsSelect";
import { ReleasesReduxState } from "../../../types/releaseTypes";

export default function availableRevisionsSelect(
  state: ReleasesReduxState["availableRevisionsSelect"] = AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  action: AvailableRevisionsSelectAction
) {
  switch (action.type) {
    case SET_AVAILABLE_REVISIONS_SELECT:
      return action.payload.value;
    default:
      return state;
  }
}
