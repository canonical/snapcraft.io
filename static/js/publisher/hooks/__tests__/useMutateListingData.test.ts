import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import useMutateListingData from "../useMutateListingData";

import { mockListingData } from "../../test-utils";

describe("useMutateListingData", () => {
  test("Calls useMutatation", () => {
    vi.spyOn(ReactQuery, "useMutation").mockImplementation(vi.fn());
    renderHook(() =>
      useMutateListingData({
        data: mockListingData,
        dirtyFields: {},
        getDefaultData: vi.fn(),
        refetch: vi.fn(),
        reset: vi.fn(),
        setStatusNotification: vi.fn(),
        setUpdateMetadataOnRelease: vi.fn(),
        shouldShowUpdateMetadataWarning: vi.fn(),
        snapName: "test-snap",
      }),
    );
    expect(ReactQuery.useMutation).toHaveBeenCalled();
  });
});
