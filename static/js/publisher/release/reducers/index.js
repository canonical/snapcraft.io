import { combineReducers } from "redux";

const revisions = function(state = {}, action) {
  switch (action.type) {
    case "UPDATE_REVISIONS":
      return {
        ...state,
        ...action.payload.revisions
      };
    default:
      return state;
  }
};

const releases = combineReducers({
  revisions
});

export default releases;
