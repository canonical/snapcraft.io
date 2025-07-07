import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { useMembers } from "../index";

describe("useMembers", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useMembers("storeId"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
