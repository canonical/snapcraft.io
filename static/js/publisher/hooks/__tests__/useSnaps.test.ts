import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { useSnaps } from "../index";

describe("useSnaps", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useSnaps("brandId"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
