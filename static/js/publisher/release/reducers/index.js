import { combineReducers } from "redux";

import channelMap from "./channelMap";
import history from "./history";
import releases from "./releases";
import revisions from "./revisions";

const releasesReducers = combineReducers({
  channelMap,
  history,
  revisions,
  releases
});

export default releasesReducers;
