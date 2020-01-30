import { triggerEventReleaseUI } from "../../../base/ga";

export function triggerGAEvent() {
  const eventLabelItems = [...arguments];
  const eventAction = eventLabelItems.shift();
  let eventLabel = "";

  return (dispatch, getState) => {
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
