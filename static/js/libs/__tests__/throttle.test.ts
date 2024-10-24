import throttle from "../throttle";

describe("throttle", () => {
  test("calls function", () => {
    const fn = jest.fn();
    const throttledFunction: () => void = throttle(fn, -1);
    throttledFunction();
    expect(fn).toHaveBeenCalled();
  });

  test("doesn't call function", () => {
    const fn = jest.fn();
    const throttledFunction: () => void = throttle(fn, 1);
    throttledFunction();
    expect(fn).not.toHaveBeenCalled();
  });
});
