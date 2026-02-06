import configureMockStore from "redux-mock-store";
import { thunk } from "redux-thunk";

const mockStore = configureMockStore<ReleasesReduxState, DispatchFn>([thunk]);

import { triggerGAEvent } from "../gaEventTracking";
import {
  DispatchFn,
  Options,
  ReleasesReduxState,
} from "../../../../types/releaseTypes";
import { Mock } from "vitest";

declare global {
  var dataLayer: Array<DataLayerEvent>;
}

describe("triggerGAEvent", () => {
  beforeEach(() => {
    const dataLayer: Array<DataLayerEvent> = [];
    dataLayer.push = vi.fn();
    global.dataLayer = dataLayer;
  });

  afterEach(() => {
    // @ts-expect-error we're resetting the array between tests
    global.dataLayer = undefined;
  });

  it("should call the dataLayer.push function", () => {
    const store = mockStore({
      options: { snapName: "testSnap" } as Options,
    } as ReleasesReduxState);
    store.dispatch(triggerGAEvent("test", "test"));

    expect(global.dataLayer.push).toHaveBeenCalled();
  });

  it("checks should call the dataLayer.push function once", () => {
    const store = mockStore({
      options: { snapName: "testSnap" } as Options,
    } as ReleasesReduxState);
    store.dispatch(triggerGAEvent("test", "test"));

    expect((global.dataLayer.push as Mock).mock.calls.length).toEqual(1);
  });

  it("should return an array of arrays containing an object", () => {
    const store = mockStore({
      options: { snapName: "testSnap" } as Options,
    } as ReleasesReduxState);
    store.dispatch(triggerGAEvent("test", "test"));

    expect((global.dataLayer.push as Mock).mock.calls).toEqual([
      [
        {
          event: "GAEvent",
          eventAction: "test",
          eventCategory: "Release UI",
          eventLabel: "testSnap/test",
          eventValue: undefined,
        },
      ],
    ]);
  });
});
