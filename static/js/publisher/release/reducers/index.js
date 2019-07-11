import { combineReducers } from "redux";

import availableRevisionsSelect from "./availableRevisionsSelect";
import branches from "./branches";
import channelMap from "./channelMap";
import currentTrack from "./currentTrack";
import defaultTrack from "./defaultTrack";
import history from "./history";
import modal from "./modal";
import notification from "./globalNotification";
import options from "./options";
import pendingCloses from "./pendingCloses";
import pendingReleases from "./pendingReleases";
import releases from "./releases";
import revisions from "./revisions";

const releasesReducers = combineReducers({
  availableRevisionsSelect,
  branches,
  channelMap,
  currentTrack,
  defaultTrack,
  history,
  modal,
  notification,
  options,
  pendingCloses,
  pendingReleases,
  revisions,
  releases
});

export default releasesReducers;
