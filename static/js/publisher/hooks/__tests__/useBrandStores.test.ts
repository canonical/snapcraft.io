import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { useBrandStores } from "../index";

describe("useBrandStores", () => {
  test("Calls useQuery", () => {
    vi.spyOn(ReactQuery, "useQuery").mockImplementation(vi.fn());
    renderHook(() => useBrandStores());
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
