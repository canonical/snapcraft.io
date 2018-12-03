import { combineReducers } from "redux";

import revisions from "./revisions";

const releases = combineReducers({
  revisions
});

export default releases;
