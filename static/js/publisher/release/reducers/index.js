import { combineReducers } from "redux";

import channelMap from "./channelMap";
import history from "./history";
import pendingCloses from "./pendingCloses";
import pendingReleases from "./pendingReleases";
import releases from "./releases";
import revisions from "./revisions";
import unreleasedSelect from "./unreleasedSelect";

const releasesReducers = combineReducers({
  channelMap,
  history,
  pendingCloses,
  pendingReleases,
  revisions,
  releases,
  unreleasedSelect
});

export default releasesReducers;
