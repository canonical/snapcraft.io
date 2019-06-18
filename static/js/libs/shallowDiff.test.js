import shallowDiff from "./shallowDiff";

describe("shallowDiff", () => {
  it("should return false if nothing is different", () => {
    expect(shallowDiff({}, {})).toEqual(false);
  });

  it("should return true if different", () => {
    let initialState = { test: true };
    let addedState = { ...initialState, added: true };
    let removedState = {};
    let changeState = { test: false };

    expect(shallowDiff(initialState, addedState)).toEqual(true);
    expect(shallowDiff(initialState, removedState)).toEqual(true);
    expect(shallowDiff(initialState, changeState)).toEqual(true);
  });
});
