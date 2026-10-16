import { renderHook } from "@testing-library/react";

import useRevalidateField from "../useRevalidateField";

describe("useRevalidateField", () => {
  it("triggers validation when the field has a value", () => {
    const trigger = vi.fn();
    const clearErrors = vi.fn();
    renderHook(() =>
      useRevalidateField(trigger, clearErrors, "name", "a-name", []),
    );
    expect(trigger).toHaveBeenCalledWith("name");
    expect(clearErrors).not.toHaveBeenCalled();
  });

  it("clears errors when the field has no value", () => {
    const trigger = vi.fn();
    const clearErrors = vi.fn();
    renderHook(() => useRevalidateField(trigger, clearErrors, "name", "", []));
    expect(clearErrors).toHaveBeenCalledWith("name");
    expect(trigger).not.toHaveBeenCalled();
  });

  it.each([0, false])("triggers validation for a value of %s", (value) => {
    const trigger = vi.fn();
    const clearErrors = vi.fn();
    renderHook(() =>
      useRevalidateField(trigger, clearErrors, "name", value, []),
    );
    expect(trigger).toHaveBeenCalledWith("name");
    expect(clearErrors).not.toHaveBeenCalled();
  });

  it("reruns when an extra dependency changes", () => {
    const trigger = vi.fn();
    const clearErrors = vi.fn();
    const { rerender } = renderHook(
      ({ dep }: { dep: number }) =>
        useRevalidateField(trigger, clearErrors, "name", "a-name", [dep]),
      { initialProps: { dep: 1 } },
    );
    expect(trigger).toHaveBeenCalledTimes(1);
    rerender({ dep: 2 });
    expect(trigger).toHaveBeenCalledTimes(2);
  });
});
