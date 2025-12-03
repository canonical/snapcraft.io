import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";
import { OPEN_BRANCHES, CLOSE_BRANCHES } from "../actions/branches";

export type OpenBranchesAction = GenericReleasesAction<typeof OPEN_BRANCHES, string>;

export type CloseBranchesAction = GenericReleasesAction<typeof CLOSE_BRANCHES, string>;

export type BranchesAction = OpenBranchesAction | CloseBranchesAction;

export default function branches(
  state: ReleasesReduxState["branches"] = [],
  action: BranchesAction
) {
  switch (action.type) {
    case OPEN_BRANCHES: {
      const newState = state.slice(0);
      if (!newState.includes(action.payload)) {
        newState.push(action.payload);
      }
      return newState;
    }
    case CLOSE_BRANCHES: {
      const newState = state.slice(0);
      const index = newState.indexOf(action.payload);
      newState.splice(index, 1);
      return newState;
    }
    default:
      return state;
  }
}
