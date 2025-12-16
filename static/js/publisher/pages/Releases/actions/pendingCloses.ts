import { GenericReleasesAction } from "../../../types/releaseTypes";
import { CancelPendingReleasesAction, ReleaseRevisionAction } from "./pendingReleases";

export const CLOSE_CHANNEL = "CLOSE_CHANNEL";

export type CloseChannelAction = GenericReleasesAction<
  typeof CLOSE_CHANNEL,
  {
    channel: string;
  }
>;

export type PendingClosesAction =
  | CloseChannelAction
  | ReleaseRevisionAction
  | CancelPendingReleasesAction;

export function closeChannel(channel: string): CloseChannelAction {
  return {
    type: CLOSE_CHANNEL,
    payload: { channel },
  };
}
