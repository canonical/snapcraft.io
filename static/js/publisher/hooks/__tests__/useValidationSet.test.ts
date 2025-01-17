import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import useValidationSet from "../useValidationSet";

describe("useValidationSet", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useValidationSet("test-id"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
