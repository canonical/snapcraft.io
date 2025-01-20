import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { useBrand } from "../index";

describe("useBrand", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useBrand("brandId"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
