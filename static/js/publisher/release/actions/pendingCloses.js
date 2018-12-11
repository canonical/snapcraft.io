export const CLOSE_CHANNEL = "CLOSE_CHANNEL";

export function closeChannel(channel) {
  return {
    type: CLOSE_CHANNEL,
    payload: { channel }
  };
}
