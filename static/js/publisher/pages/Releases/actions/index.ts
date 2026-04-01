import type { ArchitecturesAction } from "./architectures";
import type { AvailableRevisionsSelectAction } from "./availableRevisionsSelect";
import type { BranchesAction } from "./branches";
import type { ChannelMapAction } from "./channelMap";
import type { CurrentTrackAction } from "./currentTrack";
import type { DefaultTrackAction } from "./defaultTrack";
import type { FailedRevisionsAction } from "./failedRevisions";
import type { SendGAEventAction } from "./gaEventTracking";
import type { NotificationAction } from "./globalNotification";
import type { HistoryAction } from "./history";
import type { ModalAction } from "./modal";
import type { OptionsAction } from "./options";
import type { PendingChangesAction } from "./pendingChanges";
import type { ReleasesAction } from "./releases";
import type { RevisionsAction } from "./revisions";

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
