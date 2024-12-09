import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import useVerified from "../useVerified";

describe("useVerified", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useVerified("test-snap"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
