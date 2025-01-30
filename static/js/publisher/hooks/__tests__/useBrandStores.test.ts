import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { useBrandStores } from "../index";

describe("useBrandStores", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useBrandStores());
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
