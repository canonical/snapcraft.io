import { BrowserRouter, useSearchParams } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import * as MetricsRenderMethods from "../metrics/metrics";

import { TerritoryMetrics } from "../TerritoryMetrics";

import { mockTerritoryMetrics } from "../../../test-utils";

const queryClient = new QueryClient();

const renderComponent = (isEmpty: boolean) => {
  const mock = vi.spyOn(MetricsRenderMethods, "renderTerritoriesMetrics");
  mock.mockImplementation(vi.fn());

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TerritoryMetrics isEmpty={isEmpty} onDataLoad={vi.fn()} />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

vi.mock("react-query", async () => ({
  ...(await vi.importActual("react-query")),
  useQuery: vi.fn(),
}));

vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useSearchParams: vi.fn(),
}));

describe("ActiveDeviceMetrics", () => {
  beforeEach(() => {
    // @ts-expect-error mocks
    useSearchParams.mockReturnValue([new URLSearchParams()]);
  });

  test("renders the information correctly", async () => {
    // @ts-expect-error mocks
    useQuery.mockImplementation(() => ({
      status: "success",
      data: mockTerritoryMetrics,
    }));

    renderComponent(false);

    await waitFor(() => {
      expect(screen.getByText("Territories")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  test("renders the error state", async () => {
    // @ts-expect-error mocks
    useQuery.mockImplementation(() => ({
      status: "error",
      data: undefined,
    }));

    renderComponent(false);

    await waitFor(() => {
      expect(
        screen.getByText("An error occurred. Please try again."),
      ).toBeInTheDocument();
    });
  });

  test("renders the loading state", async () => {
    // @ts-expect-error mocks
    useQuery.mockImplementation(() => ({
      isFetching: true,
      data: undefined,
    }));

    renderComponent(false);

    await waitFor(() => {
      expect(screen.getByText("Loading")).toBeInTheDocument();
    });
  });

  test("renders the empty state", async () => {
    // @ts-expect-error mocks
    useQuery.mockImplementation(() => ({
      status: "success",
      data: undefined,
    }));

    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText("No data found.")).toBeInTheDocument();
    });
  });
});
