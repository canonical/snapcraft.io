import "@testing-library/jest-dom";
import { triggerEventReleaseUI, triggerEvent } from "../ga";

describe("triggerEventReleaseUI", () => {
  test("pushes event to dataLayer", () => {
    window.dataLayer = [];

    triggerEventReleaseUI("action", "event label");

    expect(window.dataLayer[0].event).toBe("GAEvent");
    expect(window.dataLayer[0].eventCategory).toBe("Release UI");
    expect(window.dataLayer[0].eventAction).toBe("action");
    expect(window.dataLayer[0].eventLabel).toBe("event label");
    expect(window.dataLayer[0].eventValue).toBeUndefined();
  });
});

describe("triggerEvent", () => {
  test("pushes event to dataLayer", () => {
    window.dataLayer = [];

    triggerEvent("category", "from", "to", "label");

    expect(window.dataLayer[0].event).toBe("GAEvent");
    expect(window.dataLayer[0].eventCategory).toBe("snapcraft.io-category");
    expect(window.dataLayer[0].eventAction).toBe("from:from to:to");
    expect(window.dataLayer[0].eventLabel).toBe("label");
    expect(window.dataLayer[0].eventValue).toBeUndefined();
  });
});
