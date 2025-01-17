import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { usePolicies } from "../index";

describe("usePolicies", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => usePolicies("policyId", "modelId"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
