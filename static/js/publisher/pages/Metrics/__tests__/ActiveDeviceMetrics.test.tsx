import { BrowserRouter, useSearchParams } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import * as MetricsRenderMethods from "../metrics/metrics";

import { mockActiveDeviceMetrics } from "../../../test-utils";

import ActiveDeviceMetrics from "../ActiveDeviceMetrics";

const queryClient = new QueryClient();

const renderComponent = (isEmpty: boolean) => {
  const mock = vi.spyOn(MetricsRenderMethods, "renderActiveDevicesMetrics");
  mock.mockImplementation(vi.fn());

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ActiveDeviceMetrics isEmpty={isEmpty} onDataLoad={vi.fn()} />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

vi.mock("react-query", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useSearchParams: vi.fn(),
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
        data: {
          daysWithoutData: [],
        },
      };
    });

    renderComponent(false);

    await waitFor(() => {
      expect(screen.getByText("Weekly active devices")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Past 30 days")).toBeInTheDocument();
      expect(screen.getByText("By version")).toBeInTheDocument();
      expect(
        screen.queryByText(
          "Metrics for the most recent days may be incomplete or missing. They will be updated and accurate within a few hours.",
        ),
      ).toBeNull();
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
              daysWithoutData: [],
            },
          };
        }
      }
      return {
        status: "success",
        data: {
          daysWithoutData: [],
        },
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
              daysWithoutData: [],
            },
          };
        }
      }
      return {
        status: "success",
        data: {
          daysWithoutData: [],
        },
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

  test("renders the warning", async () => {
    // @ts-expect-error mocks
    useQuery.mockImplementation((params) => {
      if (params) {
        if (params.queryKey[0] === "activeDeviceMetrics") {
          const mock = {
            ...mockActiveDeviceMetrics,
            daysWithoutData: ["2024-08-27"],
          };
          return {
            status: "success",
            data: mock,
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
              daysWithoutData: [],
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
        screen.getByText(
          "Metrics for the most recent days may be incomplete or missing. They will be updated and accurate within a few hours.",
        ),
      ).toBeInTheDocument();
    });
  });
});
