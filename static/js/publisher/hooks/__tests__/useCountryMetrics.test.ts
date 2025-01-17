import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";
import useCountryMetrics from "../useCountryMetrics";

describe("useCountryMetrics", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useCountryMetrics("test-id"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
