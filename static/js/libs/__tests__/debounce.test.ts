import debounce from "../debounce";
import type { Mock } from "vitest";

vi.useFakeTimers();
const fn: Mock = vi.fn();

describe("debounce", () => {
  test("function is only called once", () => {
    const debouncedFn: () => void = debounce(fn, 1000);

    for (let i = 0; i < 1000; i++) {
      debouncedFn();
    }

    vi.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("function is called with immediate flag", () => {
    const debouncedFn: () => void = debounce(fn, 0, false);

    for (let i = 0; i < 1000; i++) {
      debouncedFn();
    }

    vi.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
