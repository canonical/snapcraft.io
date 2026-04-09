import type { AppDispatch, RootState } from "./store";
import { triggerEventReleaseUI } from '../../../base/ga';

// Google Analytics event which pushes the whole store state
// Usage: dispatch(triggerGAEvent(... params ...));
// This function just performs a side effect (doesn't modify store state)
export function triggerGAEvent(eventAction: string, ...args: string[]) {
  const eventLabelItems = [...args];
  let eventLabel = "";

  return (_: AppDispatch, getState: () => RootState) => {
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
  };
}
