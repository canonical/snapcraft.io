import { combineReducers, Reducer, ReducersMapObject } from "redux";

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
import pendingChanges from "./pendingChanges";
import releases from "./releases";
import revisions from "./revisions";

import { ReleasesReduxState } from "../../../types/releaseTypes";
import { RootAction } from "../actions";

const reducersMap: ReducersMapObject<ReleasesReduxState, RootAction> = {
  architectures,
  availableRevisionsSelect,
  branches,
  channelMap,
  currentTrack,
  defaultTrack,
  history,
  modal,
  notification,
  options,
  pendingChanges,
  releases,
  revisions,
  failedRevisions,
};

const releasesReducers = (
    combineReducers(reducersMap) as unknown
  ) as Reducer<ReleasesReduxState, RootAction>;

export default releasesReducers;
