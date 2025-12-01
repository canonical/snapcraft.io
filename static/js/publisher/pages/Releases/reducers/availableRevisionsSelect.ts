import { AVAILABLE_REVISIONS_SELECT_UNRELEASED } from "../constants";
import { SET_AVAILABLE_REVISIONS_SELECT } from "../actions/availableRevisionsSelect";
import {
  AvailableRevisionsSelect,
  ReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

type AvailableRevisionsSelectAction = ReleasesAction & {
  payload: {
    value: AvailableRevisionsSelect;
  };
};

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
