import { combineReducers } from "redux";

import history from "./history";
import releases from "./releases";
import revisions from "./revisions";

const releasesReducers = combineReducers({
  history,
  revisions,
  releases
});

export default releasesReducers;
