import * as ReactQuery from "react-query";
import { renderHook } from "@testing-library/react";

import useMutateListingData from "../useMutateListingData";

import { mockListingData } from "../../test-utils";

describe("useMutateListingData", () => {
  test("Calls useMutatation", () => {
    jest.spyOn(ReactQuery, "useMutation").mockImplementation(jest.fn());
    renderHook(() =>
      useMutateListingData({
        data: mockListingData,
        dirtyFields: {},
        getDefaultData: jest.fn(),
        refetch: jest.fn(),
        reset: jest.fn(),
        setShowSuccessNotification: jest.fn(),
        setUpdateMetadataOnRelease: jest.fn(),
        shouldShowUpdateMetadataWarning: jest.fn(),
        snapName: "test-snap",
        setShowUpdateMetadataMessage: jest.fn(),
      }),
    );
    expect(ReactQuery.useMutation).toHaveBeenCalled();
  });
});
