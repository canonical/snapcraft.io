import { BrowserRouter, useSearchParams } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import * as MetricsRenderMethods from "../metrics/metrics";

import { mockActiveDeviceMetrics } from "../../../test-utils";

import ActiveDeviceMetrics from "../ActiveDeviceMetrics";

const queryClient = new QueryClient();

const renderComponent = (isEmpty: boolean) => {
  const mock = jest.spyOn(MetricsRenderMethods, "renderActiveDevicesMetrics");
  mock.mockImplementation(jest.fn());

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ActiveDeviceMetrics isEmpty={isEmpty} onDataLoad={jest.fn()} />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useSearchParams: jest.fn(),
}));

describe("ActiveDeviceMetrics", () => {
  beforeEach(() => {
    // @ts-expect-error mocks
    useSearchParams.mockReturnValue([new URLSearchParams()]);
  });

  test("renders the information correctly", async () => {
    // @ts-expect-error mocks
    useQuery.mockImplementation((params) => {
      if (params) {
        if (params.queryKey[0] === "activeDeviceMetrics") {
          return {
            status: "success",
            data: mockActiveDeviceMetrics,
          };
        } else if (params.queryKey[0] === "latestActiveDevicesMetric") {
          return {
            status: "success",
            data: 5,
          };
        } else {
          return {
            status: "success",
            data: undefined,
          };
        }
      }
      return {
        status: "success",
        data: {},
      };
    });

    renderComponent(false);

    await waitFor(() => {
      expect(screen.getByText("Weekly active devices")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Past 30 days")).toBeInTheDocument();
      expect(screen.getByText("By version")).toBeInTheDocument();
    });
  });

  test("renders the error state", async () => {
    // @ts-expect-error mocks
    useQuery.mockImplementation((params) => {
      if (params) {
        if (params.queryKey[0] === "activeDeviceMetrics") {
          return {
            status: "error",
            data: undefined,
          };
        } else if (params.queryKey[0] === "latestActiveDevicesMetric") {
          return {
            status: "success",
            data: 5,
          };
        } else {
          return {
            status: "success",
            data: {
              buckets: [],
              name: "annotations",
              series: [],
            },
          };
        }
      }
      return {
        status: "success",
        data: {},
      };
    });

    renderComponent(false);

    await waitFor(() => {
      expect(
        screen.getByText("An error occurred. Please try again."),
      ).toBeInTheDocument();
    });
  });

  test("renders the loading state", async () => {
    // @ts-expect-error mocks
    useQuery.mockImplementation((params) => {
      if (params) {
        if (params.queryKey[0] === "activeDeviceMetrics") {
          return {
            isFetching: true,
            data: undefined,
          };
        } else if (params.queryKey[0] === "latestActiveDevicesMetric") {
          return {
            status: "success",
            data: 5,
          };
        } else {
          return {
            status: "success",
            data: {
              buckets: [],
              name: "annotations",
              series: [],
            },
          };
        }
      }
      return {
        status: "success",
        data: {},
      };
    });

    renderComponent(false);

    await waitFor(() => {
      expect(screen.getByText("Loading")).toBeInTheDocument();
    });
  });

  test("renders the empty state", async () => {
    // @ts-expect-error mocks
    useQuery.mockImplementation((params) => {
      if (params) {
        if (params.queryKey[0] === "activeDeviceMetrics") {
          return {
            status: "success",
            data: undefined,
          };
        } else if (params.queryKey[0] === "latestActiveDevicesMetric") {
          return {
            status: "success",
            data: 0,
          };
        } else {
          return {
            status: "success",
            data: {
              buckets: [],
              name: "annotations",
              series: [],
            },
          };
        }
      }
      return {
        status: "success",
        data: {},
      };
    });

    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText("No data found.")).toBeInTheDocument();
    });
  });
});
