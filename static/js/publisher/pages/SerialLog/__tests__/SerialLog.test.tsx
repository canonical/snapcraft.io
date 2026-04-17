import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

import SerialLog from "../SerialLog";
import { useSerialLogs, useModels, useSortTableData } from "../../../hooks";

import type { UseQueryResult } from "react-query";
import type {
  ApiResponse,
  SerialLogResponse,
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
  useSerialLogs: vi.fn(),
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
        <SerialLog />
      </QueryClientProvider>
    </BrowserRouter>,
  );
}

const useSerialLogsNoPermissions = {
  data: {
    message: "There was a problem fetching serial logs",
    success: false,
  },
  isLoading: false,
  isError: false,
} as UseQueryResult<ApiResponse<SerialLogResponse>, Error>;

const useSerialLogsPermissions = {
  data: {
    data: { items: [], "next-cursor": null },
    success: true,
  },
  isLoading: false,
  isError: false,
} as unknown as UseQueryResult<ApiResponse<SerialLogResponse>, Error>;

const mockUseModels = vi.mocked(useModels);
mockUseModels.mockReturnValue({
  data: [],
} as unknown as UseQueryResult<Model[], Error>);

const mockUseSortTableData = vi.mocked(useSortTableData);
mockUseSortTableData.mockReturnValue({
  rows: [],
  updateSort: vi.fn(),
});

const mockuseSerialLogs = vi.mocked(useSerialLogs);

describe("SerialLog", () => {
  it("displays message if user has no serial logs access", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsNoPermissions);
    renderComponent();
    expect(
      screen.getByText("There was a problem fetching serial logs"),
    ).toBeInTheDocument();
  });

  it("doesn't display filter if user has no serial logs access", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsNoPermissions);
    renderComponent();
    expect(
      screen.queryByLabelText("Search serial logs"),
    ).not.toBeInTheDocument();
  });

  it("doesn't display table if user has no serial logs access", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsNoPermissions);
    renderComponent();
    expect(screen.queryByTestId("serial-log-table")).not.toBeInTheDocument();
  });

  it("doesn't display message if user has serial logs access", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);
    renderComponent();
    expect(
      screen.queryByText("There was a problem fetching serial logs"),
    ).not.toBeInTheDocument();
  });

  it("displays filter if user has serial logs access", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);
    renderComponent();
    expect(screen.getByLabelText("Search serial logs")).toBeInTheDocument();
  });

  it("displays table if user has serial logs access", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);
    renderComponent();
    expect(screen.getByTestId("serial-log-table")).toBeInTheDocument();
  });
});
