import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { useModels } from "../index";

describe("useModels", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useModels("modelId"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
