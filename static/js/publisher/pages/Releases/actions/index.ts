import { ArchitecturesAction } from "./architectures";
import { AvailableRevisionsSelectAction } from "./availableRevisionsSelect";
import { BranchesAction } from "./branches";
import { ChannelMapAction } from "./channelMap";
import { CurrentTrackAction } from "./currentTrack";
import { DefaultTrackAction } from "./defaultTrack";
import { FailedRevisionsAction } from "./failedRevisions";
import { SendGAEventAction } from "./gaEventTracking";
import { NotificationAction } from "./globalNotification";
import { HistoryAction } from "./history";
import { ModalAction } from "./modal";
import { OptionsAction } from "./options";
import { PendingChangesAction } from "./pendingChanges";
import { ReleasesAction } from "./releases";
import { RevisionsAction } from "./revisions";

export * from "./architectures";
export * from "./availableRevisionsSelect";
export * from "./channelMap";
export * from "./currentTrack";
export * from "./defaultTrack";
export * from "./history";
export * from "./modal";
export * from "./globalNotification";
export * from "./options";
export * from "./pendingChanges";
export * from "./releases";
export * from "./revisions";

export type RootAction =
  | ArchitecturesAction
  | AvailableRevisionsSelectAction
  | BranchesAction
  | ChannelMapAction
  | CurrentTrackAction
  | DefaultTrackAction
  | FailedRevisionsAction
  | SendGAEventAction
  | NotificationAction
  | HistoryAction
  | ModalAction
  | OptionsAction
  | PendingChangesAction
  | ReleasesAction
  | RevisionsAction;
