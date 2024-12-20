import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import useFetchAccountSnaps from "../useFetchAccountSnaps";

describe("useFetchAccountSnaps", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useFetchAccountSnaps());
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
