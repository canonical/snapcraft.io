import { OPEN_BRANCHES, CLOSE_BRANCHES } from "../actions/branches";

export default function branches(state = [], action) {
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
