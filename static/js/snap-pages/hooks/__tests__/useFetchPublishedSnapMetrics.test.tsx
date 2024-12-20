import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import useFetchPublishedSnapMetrics from "../useFetchPublishedSnapMetrics";

describe("useFetchPublishedSnapMetrics", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useFetchPublishedSnapMetrics([]));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
