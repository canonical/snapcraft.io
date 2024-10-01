import { BrowserRouter, useSearchParams } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import * as MetricsRenderMethods from "../../../../publisher/metrics/metrics";

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
    </QueryClientProvider>
  );
};

const mockActiveDeviceMetrics = {
  active_devices: {
    buckets: [
      "2024-08-19",
      "2024-08-20",
      "2024-08-21",
      "2024-08-22",
      "2024-08-23",
      "2024-08-24",
      "2024-08-25",
      "2024-08-26",
      "2024-08-27",
      "2024-08-28",
      "2024-08-29",
      "2024-08-30",
      "2024-08-31",
      "2024-09-01",
      "2024-09-02",
      "2024-09-03",
      "2024-09-04",
      "2024-09-05",
      "2024-09-06",
      "2024-09-07",
      "2024-09-08",
      "2024-09-09",
      "2024-09-10",
      "2024-09-11",
      "2024-09-12",
      "2024-09-13",
      "2024-09-14",
      "2024-09-15",
      "2024-09-16",
      "2024-09-17",
      "2024-09-18",
    ],
    name: "weekly_installed_base_by_version",
    series: [
      {
        name: "1.0",
        values: [
          9, 9, 8, 8, 9, 8, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5,
          5, 6, 6, 5, 5, 5, 5, 5,
        ],
      },
    ],
  },
  latest_active_devices: 5,
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
    // @ts-ignore
    useSearchParams.mockReturnValue([new URLSearchParams()]);
  });

  test("renders the information correctly", async () => {
    // @ts-ignore
    useQuery.mockImplementation((params) => {
      console.log(params);
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
    // @ts-ignore
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
        screen.getByText("An error occurred. Please try again.")
      ).toBeInTheDocument();
    });
  });

  test("renders the loading state", async () => {
    // @ts-ignore
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
    // @ts-ignore
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
