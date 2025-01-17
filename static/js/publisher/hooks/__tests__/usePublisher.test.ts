import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { usePublisher } from "../index";

describe("usePublisher", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => usePublisher());
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
