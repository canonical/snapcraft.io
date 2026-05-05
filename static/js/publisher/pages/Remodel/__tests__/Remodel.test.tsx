import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

import Remodel from "../Remodel";
import { useRemodels, useModels, useSortTableData } from "../../../hooks";

import type { UseQueryResult } from "react-query";
import type {
  ApiResponse,
  RemodelResponse,
  Model,
} from "../../../types/shared";

const mockFilterQuery = "test-model";

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useSearchParams: () => [new URLSearchParams({ filter: mockFilterQuery })],
}));

vi.mock("../../Portals/Portals", async (importOriginal) => ({
  ...(await importOriginal()),
  PortalEntrance: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../../hooks", () => ({
  useRemodels: vi.fn(),
  useModels: vi.fn(),
  useSortTableData: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function renderComponent() {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Remodel />
      </QueryClientProvider>
    </BrowserRouter>,
  );
}

const useRemodelsNoPermissions = {
  data: {
    message: "There was a problem fetching remodels",
    success: false,
  },
  isLoading: false,
  isError: false,
} as UseQueryResult<ApiResponse<RemodelResponse>, Error>;

const useRemodelsPermissions = {
  data: {
    data: { allowlist: [], "next-cursor": null },
    success: true,
  },
  isLoading: false,
  isError: false,
} as unknown as UseQueryResult<ApiResponse<RemodelResponse>, Error>;

const mockUseModels = vi.mocked(useModels);
mockUseModels.mockReturnValue({
  data: [],
} as unknown as UseQueryResult<Model[], Error>);

const mockUseSortTableData = vi.mocked(useSortTableData);
mockUseSortTableData.mockReturnValue({
  rows: [],
  updateSort: vi.fn(),
});

const mockUseRemodels = vi.mocked(useRemodels);

describe("Remodel", () => {
  it("displays message if user has no remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsNoPermissions);
    renderComponent();
    expect(
      screen.getByText("There was a problem fetching remodels"),
    ).toBeInTheDocument();
  });

  it("doesn't display table if user has no remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsNoPermissions);
    renderComponent();
    expect(screen.queryByTestId("remodel-table")).not.toBeInTheDocument();
  });

  it("doesn't display 'Configure' button if user has no remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsNoPermissions);
    renderComponent();
    expect(
      screen.queryByRole("link", { name: "Configure remodels" }),
    ).not.toBeInTheDocument();
  });

  it("doesn't display message if user has remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsPermissions);
    renderComponent();
    expect(
      screen.queryByText("There was a problem fetching remodels"),
    ).not.toBeInTheDocument();
  });

  it("displays table if user has remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsPermissions);
    renderComponent();
    expect(screen.getByTestId("remodel-table")).toBeInTheDocument();
  });

  it("displays 'Configure' button if user has remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsPermissions);
    renderComponent();
    expect(
      screen.getByRole("link", { name: "Configure remodels" }),
    ).toBeInTheDocument();
  });
});
