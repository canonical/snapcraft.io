import { AVAILABLE_REVISIONS_SELECT_UNRELEASED } from "../constants";
import { SET_AVAILABLE_REVISIONS_SELECT } from "../actions/availableRevisionsSelect";
import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

export type SetAvailableRevisionsSelectAction = GenericReleasesAction<
  typeof SET_AVAILABLE_REVISIONS_SELECT,
  {
    value: string;
  }
>;

export type AvailableRevisionsSelectAction = SetAvailableRevisionsSelectAction;

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
