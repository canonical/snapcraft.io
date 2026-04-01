import { triggerEventReleaseUI } from "../../../../base/ga";
import type { GenericReleasesAction, ReleasesReduxState } from "../../../types/releaseTypes";
import type { DispatchFn } from "../store";

export const GA_EVENT_SENT = "GA_EVENT_SENT";

export type SendGAEventAction = GenericReleasesAction<
  typeof GA_EVENT_SENT,
  never
>;

export function triggerGAEvent(eventAction: string, ...args: string[]) {
  const eventLabelItems = [...args];
  let eventLabel = "";

  return (_: DispatchFn, getState: () => ReleasesReduxState) => {
    const currentState = getState();

    if (eventLabelItems.length > 1) {
      eventLabel = `from:${currentState.options.snapName}/
      ${eventLabelItems[0]} to:${currentState.options.snapName}/
      ${eventLabelItems[1]}`;
    } else if (eventLabelItems.length === 1) {
      eventLabel = `${currentState.options.snapName}/${eventLabelItems[0]}`;
    } else {
      eventLabel = currentState.options.snapName;
    }
    triggerEventReleaseUI(eventAction, eventLabel);
    return { type: GA_EVENT_SENT };
  };
}
