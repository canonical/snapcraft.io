import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";
import useMetricsAnnotation from "../useMetricsAnnotation";

describe("useMetricsAnnotation", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useMetricsAnnotation("test-id"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
