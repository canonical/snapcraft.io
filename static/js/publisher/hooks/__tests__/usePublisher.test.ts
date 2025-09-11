import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { usePublisher } from "../index";

describe("usePublisher", () => {
  test("Calls useQuery", () => {
    vi.spyOn(ReactQuery, "useQuery").mockImplementation(vi.fn());
    renderHook(() => usePublisher());
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
