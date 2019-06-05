import shallowDiff from "./shallowDiff";

describe("shallowDiff", () => {
  it("should return null if nothing is different", () => {
    expect(shallowDiff({}, {})).toEqual(null);
  });

  it("should return an object of differences", () => {
    const firstState = { change: true, remove: true };
    const secondState = { change: false, add: true };

    const diff = shallowDiff(firstState, secondState);

    expect(diff).toEqual({
      add: {
        newValue: true,
        state: "ADDED"
      },
      change: {
        newValue: false,
        oldValue: true,
        state: "CHANGED"
      },
      remove: {
        oldValue: true,
        state: "REMOVED"
      }
    });
  });
});
