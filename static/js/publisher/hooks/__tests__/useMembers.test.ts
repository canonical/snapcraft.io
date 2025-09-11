import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { useMembers } from "../index";

describe("useMembers", () => {
  test("Calls useQuery", () => {
    vi.spyOn(ReactQuery, "useQuery").mockImplementation(vi.fn());
    renderHook(() => useMembers("storeId"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
