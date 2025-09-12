import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import useFetchPublishedSnapMetrics from "../useFetchPublishedSnapMetrics";

describe("useFetchPublishedSnapMetrics", () => {
  test("Calls useQuery", () => {
    vi.spyOn(ReactQuery, "useQuery").mockImplementation(vi.fn());
    renderHook(() => useFetchPublishedSnapMetrics([]));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
