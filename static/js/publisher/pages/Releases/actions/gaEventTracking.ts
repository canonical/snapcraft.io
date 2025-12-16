import { triggerEventReleaseUI } from "../../../../base/ga";
import { DispatchFn, ReleasesReduxState } from "../../../types/releaseTypes";

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
    return { type: "GA_EVENT_SENT" };
  };
}
