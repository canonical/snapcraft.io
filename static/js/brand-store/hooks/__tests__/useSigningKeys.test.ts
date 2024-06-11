import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import { useSigningKeys } from "../index";

describe("useSigningKeys", () => {
  test("Calls useQuery", () => {
    jest.spyOn(ReactQuery, "useQuery").mockImplementation(jest.fn());
    renderHook(() => useSigningKeys("signingKeyId"));
    expect(ReactQuery.useQuery).toHaveBeenCalled();
  });
});
