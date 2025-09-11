import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";
import useLatestsActiveDeviceMetric from "../useMetricsAnnotation";

describe("useLatestsActiveDeviceMetric", () => {
  test("Calls useQuery", () => {
    vi.spyOn(ReactQuery, "useQuery").mockImplementation(vi.fn());
    renderHook(() => useLatestsActiveDeviceMetric("test-id"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
