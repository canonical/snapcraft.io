import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { useInvites } from "../index";

describe("useInvites", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useInvites("storeId"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
