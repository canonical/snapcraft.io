import { combineReducers } from "redux";

import architectures from "./architectures";
import availableRevisionsSelect from "./availableRevisionsSelect";
import branches from "./branches";
import channelMap from "./channelMap";
import currentTrack from "./currentTrack";
import defaultTrack from "./defaultTrack";
import failedRevisions from "./failedRevisions";
import history from "./history";
import modal from "./modal";
import notification from "./globalNotification";
import options from "./options";
import pendingCloses from "./pendingCloses";
import pendingReleases from "./pendingReleases";
import releases from "./releases";
import revisions from "./revisions";
import { ReleasesReduxState } from "../../../types/releaseTypes";

const releasesReducers = combineReducers<ReleasesReduxState>({
  architectures,
  availableRevisionsSelect,
  branches,
  channelMap,
  currentTrack,
  defaultTrack,
  failedRevisions,
  history,
  modal,
  notification,
  options,
  pendingCloses,
  pendingReleases,
  releases,
  revisions,
});

export default releasesReducers;
