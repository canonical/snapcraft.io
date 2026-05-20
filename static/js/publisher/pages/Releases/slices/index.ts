import architectures from "./architectures";
import availableRevisionsSelect from "./availableRevisionsSelect";
import branches from "./branches";
import channelMap from "./channelMap";
import currentTrack from "./currentTrack";
import defaultTrack from "./defaultTrack";
import failedRevisions from "./failedRevisions";
import history from "./history";
import modal from "./modal";
import notification from "./notification";
import options from "./options";
import pendingChanges from "./pendingChanges";
import releases from "./releases";
import revisions from "./revisions";

const rootReducer = {
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
  pendingChanges,
  releases,
  revisions,
};

export default rootReducer;
