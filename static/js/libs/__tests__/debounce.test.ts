import debounce from "../debounce";

jest.useFakeTimers();
const fn: Function = jest.fn();

describe("debounce", () => {
  test("function is only called once", () => {
    const debouncedFn: Function = debounce(fn, 1000);

    for (let i = 0; i < 1000; i++) {
      debouncedFn();
    }

    jest.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("function is called with immediate flag", () => {
    const debouncedFn: Function = debounce(fn, 0, false);

    for (let i = 0; i < 1000; i++) {
      debouncedFn();
    }

    jest.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
