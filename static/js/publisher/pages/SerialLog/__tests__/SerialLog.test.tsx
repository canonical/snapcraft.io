import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { vi } from "vitest";
import { format, parseISO } from "date-fns";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
const mockSetSearchParams = vi.fn();
const mockNavigate = vi.fn();
const mockPathname = "/admin/test-store-id/models/test-model/serial-log";

let mockSearchParams = new URLSearchParams({ filter: mockFilterQuery });

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
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

function renderWithSearchParams(searchParams: Record<string, string> = {}) {
  mockSearchParams = new URLSearchParams(searchParams);
  mockSetSearchParams.mockClear();
  mockNavigate.mockClear();

  return renderComponent();
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T14:34:23.666Z"));
    mockSearchParams = new URLSearchParams({ filter: mockFilterQuery });
    mockSetSearchParams.mockClear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("displays message if user has no serial logs access", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsNoPermissions);
    renderComponent();
    expect(
      screen.getByText("There was a problem fetching serial logs"),
    ).toBeInTheDocument();
  });

  it("doesn't display table if user has no serial logs access", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsNoPermissions);
    renderComponent();
    expect(screen.queryByTestId("serial-log-table")).not.toBeInTheDocument();
  });

  it("keeps date selector controls visible if user has no serial logs access", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsNoPermissions);
    renderComponent();

    expect(
      screen.getByText("Showing serial logs for the last 30 days"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", {
        name: "Showing serial logs for the last 30 days",
      }),
    ).toBeInTheDocument();
  });

  it("doesn't display message if user has serial logs access", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);
    renderComponent();
    expect(
      screen.queryByText("There was a problem fetching serial logs"),
    ).not.toBeInTheDocument();
  });

  it("displays table if user has serial logs access", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);
    renderComponent();
    expect(screen.getByTestId("serial-log-table")).toBeInTheDocument();
  });

  it("passes default page size without a date range to useSerialLogs when none is set", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams();

    expect(mockuseSerialLogs).toHaveBeenCalled();
    expect(mockuseSerialLogs.mock.calls[0][2]).toEqual({
      pageSize: 25,
      page: null,
    });
  });

  it("shows the default serial log date selector summary and button", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams();

    expect(
      screen.getByText("Showing serial logs for the last 30 days"),
    ).toBeInTheDocument();
    const select = document.getElementById(
      "date-range-preset",
    ) as HTMLSelectElement;
    expect(select).toHaveValue("last-30-days");
    expect(screen.queryByLabelText("Start date")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("End date")).not.toBeInTheDocument();
  });

  it("opens the date selector panel with query string values on load", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    const startTime = "2026-05-01T12:13:14.000Z";
    const endTime = "2026-05-10T20:21:22.000Z";

    renderWithSearchParams({
      "start-time": startTime,
      "end-time": endTime,
    });

    const select = document.getElementById(
      "date-range-preset",
    ) as HTMLSelectElement;
    expect(select).toHaveValue("custom");
    expect(screen.getByLabelText("Start date")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("Start date")).toHaveValue(
      format(parseISO(startTime), "yyyy-MM-dd"),
    );
    expect(screen.getByLabelText("End date")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("End date")).toHaveValue(
      format(parseISO(endTime), "yyyy-MM-dd"),
    );
    expect(screen.getByLabelText("Start time")).toHaveAttribute("type", "time");
    expect(screen.getByLabelText("Start time")).toHaveValue(
      format(parseISO(startTime), "HH:mm:ss"),
    );
    expect(screen.getByLabelText("End time")).toHaveAttribute("type", "time");
    expect(screen.getByLabelText("End time")).toHaveValue(
      format(parseISO(endTime), "HH:mm:ss"),
    );
    expect(
      screen.getByText(
        "Showing serial logs between 1 May, 2026 and 10 May, 2026",
      ),
    ).toBeInTheDocument();
  });

  it("shows default start and end time values when opening the selector", async () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams();
    vi.useRealTimers();
    const user = userEvent.setup();

    const select = document.getElementById(
      "date-range-preset",
    ) as HTMLSelectElement;
    await user.selectOptions(select, "custom");

    expect(screen.getByLabelText("Start time")).toHaveValue("00:00:00");
    expect(screen.getByLabelText("End time")).toHaveValue("23:59:59");
  });

  it("detects an active preset date range from URL params", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams({
      "start-time": "2026-05-27T00:00:00.000Z",
      "end-time": "2026-06-02T23:59:59.000Z",
    });

    const select = document.getElementById(
      "date-range-preset",
    ) as HTMLSelectElement;
    expect(select).toHaveValue("last-7-days");
    expect(
      screen.getByText("Showing serial logs for the last 7 days"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Start date")).not.toBeInTheDocument();
  });

  it("applies a selected preset date range and clears pagination params", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams({
      filter: mockFilterQuery,
      page: "cursor",
      "page-size": "50",
    });

    const select = document.getElementById(
      "date-range-preset",
    ) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "today" } });

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: mockPathname,
      search:
        `?filter=${mockFilterQuery}` +
        "&start-time=2026-06-02T00:00:00.000Z" +
        "&end-time=2026-06-02T23:59:59.000Z",
    });
  });

  it("clears date range params when selecting the default last 30 days preset", () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams({
      filter: mockFilterQuery,
      page: "cursor",
      "page-size": "50",
      "start-time": "2026-05-01T00:00:00.000Z",
      "end-time": "2026-05-10T23:59:59.000Z",
    });

    const select = document.getElementById(
      "date-range-preset",
    ) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "last-30-days" } });

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: mockPathname,
      search: `?filter=${mockFilterQuery}`,
    });
  });

  it("shows a default date range of exactly 30 inclusive days", async () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams();
    vi.useRealTimers();
    const user = userEvent.setup();

    const select = document.getElementById(
      "date-range-preset",
    ) as HTMLSelectElement;
    await user.selectOptions(select, "custom");

    expect(screen.getByLabelText("Start date")).toHaveValue("2026-05-04");
    expect(screen.getByLabelText("End date")).toHaveValue("2026-06-02");
  });

  it("applies a valid custom date range", async () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams();
    vi.useRealTimers();
    const user = userEvent.setup();

    const select = document.getElementById(
      "date-range-preset",
    ) as HTMLSelectElement;
    await user.selectOptions(select, "custom");
    await user.clear(screen.getByLabelText("Start date"));
    await user.type(screen.getByLabelText("Start date"), "2026-05-01");
    await user.clear(screen.getByLabelText("End date"));
    await user.type(screen.getByLabelText("End date"), "2026-05-10");
    await user.click(screen.getByRole("button", { name: "Apply date range" }));

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: mockPathname,
      search:
        "?start-time=2026-05-01T00:00:00.000Z&end-time=2026-05-10T23:59:59.000Z",
    });
  });

  it("blocks applying a date range over 30 inclusive days", async () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams();
    vi.useRealTimers();
    const user = userEvent.setup();

    const select = document.getElementById(
      "date-range-preset",
    ) as HTMLSelectElement;
    await user.selectOptions(select, "custom");
    await user.clear(screen.getByLabelText("Start date"));
    await user.type(screen.getByLabelText("Start date"), "2026-05-01");
    await user.clear(screen.getByLabelText("End date"));
    await user.type(screen.getByLabelText("End date"), "2026-05-31");

    expect(
      screen.getByText("The selected date range cannot exceed 30 days."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Apply date range" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("blocks applying when start date is after end date", async () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams();
    vi.useRealTimers();
    const user = userEvent.setup();

    const select = document.getElementById(
      "date-range-preset",
    ) as HTMLSelectElement;
    await user.selectOptions(select, "custom");
    await user.clear(screen.getByLabelText("Start date"));
    await user.type(screen.getByLabelText("Start date"), "2026-05-02");
    await user.clear(screen.getByLabelText("End date"));
    await user.type(screen.getByLabelText("End date"), "2026-05-01");

    expect(
      screen.getByText("The start date must be on or before the end date."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Apply date range" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("blocks applying when start time is after end time on the same day", async () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams({
      "start-time": "2026-05-10T22:00:00.000Z",
      "end-time": "2026-05-10T01:00:00.000Z",
    });
    vi.useRealTimers();

    expect(
      screen.getByText(
        "The start time must be on or before the end time when using the same date.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Apply date range" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("closes the date panel without changing URL params when clicking Close", async () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams({
      "start-time": "2026-05-01T00:00:00.000Z",
      "end-time": "2026-05-10T23:59:59.000Z",
      "page-size": "50",
      page: "cursor",
    });
    vi.useRealTimers();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Close" }));

    // Panel should be closed
    expect(screen.queryByLabelText("Start date")).not.toBeInTheDocument();
    // URL params should not change
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("removes date range query params when clicking Clear", async () => {
    mockuseSerialLogs.mockReturnValue(useSerialLogsPermissions);

    renderWithSearchParams({
      filter: mockFilterQuery,
      "start-time": "2026-05-01T00:00:00.000Z",
      "end-time": "2026-05-10T23:59:59.000Z",
      "page-size": "50",
      page: "cursor",
    });
    vi.useRealTimers();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: mockPathname,
      search: `?filter=${mockFilterQuery}`,
    });
  });
});
