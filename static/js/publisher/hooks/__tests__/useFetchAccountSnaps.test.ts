import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import useFetchAccountSnaps from "../useFetchAccountSnaps";

describe("useFetchAccountSnaps", () => {
  test("Calls useQuery", () => {
    vi.spyOn(ReactQuery, "useQuery").mockImplementation(vi.fn());
    renderHook(() => useFetchAccountSnaps());
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
