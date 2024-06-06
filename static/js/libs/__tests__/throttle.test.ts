import throttle from "../throttle";

describe("throttle", () => {
  test("calls function", () => {
    const fn = jest.fn();

    throttle(fn, 100);

    setTimeout(() => {
      expect(fn).toHaveBeenCalled();
    }, 101);
  });
});
