import { combineReducers } from "redux";

import availableRevisionsSelect from "./availableRevisionsSelect";
import channelMap from "./channelMap";
import currentTrack from "./currentTrack";
import history from "./history";
import modal from "./modal";
import notification from "./notification";
import pendingCloses from "./pendingCloses";
import pendingReleases from "./pendingReleases";
import releases from "./releases";
import revisions from "./revisions";

const releasesReducers = combineReducers({
  availableRevisionsSelect,
  channelMap,
  currentTrack,
  history,
  modal,
  notification,
  pendingCloses,
  pendingReleases,
  revisions,
  releases
});

export default releasesReducers;
