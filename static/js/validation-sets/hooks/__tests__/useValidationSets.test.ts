import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import useValidationSets from "../useValidationSets";

describe("useValidationSets", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useValidationSets());
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
