import { combineReducers } from "redux";

import channelMap from "./channelMap";
import history from "./history";
import pendingReleases from "./pendingReleases";
import releases from "./releases";
import revisions from "./revisions";

const releasesReducers = combineReducers({
  channelMap,
  history,
  pendingReleases,
  revisions,
  releases
});

export default releasesReducers;
