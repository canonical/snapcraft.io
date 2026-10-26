import { renderHook } from "@testing-library/react";

import useLatestRef from "../useLatestRef";

describe("useLatestRef", () => {
  it("returns a ref with the current value", () => {
    const { result } = renderHook((value: number) => useLatestRef(value), {
      initialProps: 1,
    });
    expect(result.current.current).toBe(1);
  });

  it("updates the ref on rerender without changing identity", () => {
    const { result, rerender } = renderHook(
      (value: number) => useLatestRef(value),
      { initialProps: 1 },
    );
    const ref = result.current;
    rerender(2);
    expect(result.current).toBe(ref);
    expect(result.current.current).toBe(2);
  });
});
