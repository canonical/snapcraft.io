import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";
import useCountryMetrics from "../useCountryMetrics";

describe("useCountryMetrics", () => {
  test("Calls useQuery", () => {
    vi.spyOn(ReactQuery, "useQuery").mockImplementation(vi.fn());
    renderHook(() => useCountryMetrics("test-id"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
