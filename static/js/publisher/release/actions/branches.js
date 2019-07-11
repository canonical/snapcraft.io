export const OPEN_BRANCHES = "OPEN_BRANCHES";
export const CLOSE_BRANCHES = "CLOSE_BRANCHES";

export function openBranches(channelName) {
  return {
    type: OPEN_BRANCHES,
    payload: channelName
  };
}

export function closeBranches(channelName) {
  return {
    type: CLOSE_BRANCHES,
    payload: channelName
  };
}

export function toggleBranches(channelName) {
  return (dispatch, getState) => {
    const { branches } = getState();

    if (branches.includes(channelName)) {
      dispatch(closeBranches(channelName));
    } else {
      dispatch(openBranches(channelName));
    }
  };
}
