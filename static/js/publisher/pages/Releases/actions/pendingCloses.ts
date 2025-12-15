import { GenericReleasesAction } from "../../../types/releaseTypes";

export const CLOSE_CHANNEL = "CLOSE_CHANNEL";

export type CloseChannelAction = GenericReleasesAction<
  typeof CLOSE_CHANNEL,
  {
    channel: string;
  }
>;

export function closeChannel(channel: string): CloseChannelAction {
  return {
    type: CLOSE_CHANNEL,
    payload: { channel },
  };
}
