import { combineReducers } from "redux";

import revisions from "./revisions";
import history from "./history";

const releases = combineReducers({
  history,
  revisions
});

export default releases;
