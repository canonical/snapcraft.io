import { combineReducers } from "redux";

import availableRevisionsSelect from "./availableRevisionsSelect";
import channelMap from "./channelMap";
import currentTrack from "./currentTrack";
import history from "./history";
import pendingCloses from "./pendingCloses";
import pendingReleases from "./pendingReleases";
import releases from "./releases";
import revisions from "./revisions";

const releasesReducers = combineReducers({
  availableRevisionsSelect,
  channelMap,
  currentTrack,
  history,
  pendingCloses,
  pendingReleases,
  revisions,
  releases
});

export default releasesReducers;
