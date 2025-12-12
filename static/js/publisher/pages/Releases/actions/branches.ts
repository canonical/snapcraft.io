import { GenericReleasesAction, DispatchFn } from "../../../types/releaseTypes";

export const OPEN_BRANCHES = "OPEN_BRANCHES";
export const CLOSE_BRANCHES = "CLOSE_BRANCHES";

export type OpenBranchesAction = GenericReleasesAction<typeof OPEN_BRANCHES, string>;

export type CloseBranchesAction = GenericReleasesAction<typeof CLOSE_BRANCHES, string>;

export type BranchesAction = OpenBranchesAction | CloseBranchesAction;

export function openBranches(channelName: string): OpenBranchesAction {
  return {
    type: OPEN_BRANCHES,
    payload: channelName,
  };
}

export function closeBranches(channelName: string): CloseBranchesAction {
  return {
    type: CLOSE_BRANCHES,
    payload: channelName,
  };
}

export function toggleBranches(channelName: string) {
  return (dispatch: DispatchFn, getState: () => any) => {
    const { branches } = getState();

    if (branches.includes(channelName)) {
      dispatch(closeBranches(channelName));
    } else {
      dispatch(openBranches(channelName));
    }
  };
}
