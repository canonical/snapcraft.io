import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";
import useActiveDeviceMetrics from "../useActiveDeviceMetrics";

describe("useActiveDeviceMetrics", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() =>
      useActiveDeviceMetrics({
        period: "30d",
        snapId: "test-id",
        type: "version",
      })
    );
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
