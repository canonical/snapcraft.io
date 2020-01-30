/* global global, jest */

import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

const mockStore = configureMockStore([thunk]);

import { triggerGAEvent } from "./gaEventTracking";

describe("triggerGAEvent", () => {
  beforeEach(() => {
    global.dataLayer = { push: jest.fn() };
  });

  afterEach(() => {
    global.dataLayer = undefined;
  });

  it("should call the dataLayer.push function", () => {
    const store = mockStore({ options: { snapName: "testSnap" } });
    store.dispatch(triggerGAEvent("test", "test"));

    expect(global.dataLayer.push).toHaveBeenCalled();
  });

  it("checks should call the dataLayer.push function once", () => {
    const store = mockStore({ options: { snapName: "testSnap" } });
    store.dispatch(triggerGAEvent("test", "test"));

    expect(global.dataLayer.push.mock.calls.length).toEqual(1);
  });

  it("should return an array of arrays containing an object", () => {
    const store = mockStore({ options: { snapName: "testSnap" } });
    store.dispatch(triggerGAEvent("test", "test"));

    expect(global.dataLayer.push.mock.calls).toEqual([
      [
        {
          event: "GAEvent",
          eventAction: "test",
          eventCategory: "Release UI",
          eventLabel: "testSnap/test",
          eventValue: undefined
        }
      ]
    ]);
  });
});
