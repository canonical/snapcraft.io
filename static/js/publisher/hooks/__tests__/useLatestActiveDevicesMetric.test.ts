import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";
import useLatestsActiveDeviceMetric from "../useMetricsAnnotation";

describe("useLatestsActiveDeviceMetric", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useLatestsActiveDeviceMetric("test-id"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
