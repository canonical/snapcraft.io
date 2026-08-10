import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import Build from "../Build";

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useParams: () => ({
    buildId: "test-build-id",
    snapId: "test-snap-id",
  }),
}));

const queryClient = new QueryClient();

const mockBuildData = {
  snap_build: {
    arch_tag: "arm64",
    datebuilt: "2025-02-04T14:07:31.406639+00:00",
    duration: "0:14:47.375900",
    id: "test-build-id",
    logs: "https://launchpad.net",
    revision_id: "test-revision-id",
    status: "released",
    title: "Test build title",
  },
  snap_id: "test-snap-id",
  snap_name: "Test snap name",
  snap_title: "Test snap title",
};

const mockLogData = {
  raw_logs: "Test build logs",
};

vi.mock("react-query", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: vi.fn(),
}));

function renderComponent() {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Build />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

function mockUseQueryResponses(
  buildResponse: Record<string, unknown>,
  logResponse: Record<string, unknown> = {
    data: mockLogData,
    isLoading: false,
    isFetched: true,
    isFetching: false,
    isError: false,
  },
) {
  // @ts-expect-error - Mocking useQuery response
  useQuery.mockReturnValueOnce(buildResponse);
  // @ts-expect-error - Mocking useQuery response
  useQuery.mockReturnValueOnce(logResponse);
}

describe("Build", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows loading state", () => {
    mockUseQueryResponses({
      data: mockBuildData,
      isLoading: true,
      isFetched: false,
      isFetching: true,
      isError: false,
    });

    renderComponent();

    expect(
      screen.getByText(/Loading test-snap-id build data/),
    ).toBeInTheDocument();
  });

  test("shows correct build ID in table", () => {
    mockUseQueryResponses({
      data: mockBuildData,
      isLoading: false,
      isFetched: true,
      isFetching: false,
      isError: false,
    });

    renderComponent();

    expect(
      screen.getByRole("gridcell", { name: "test-build-id" }),
    ).toBeInTheDocument();
  });

  test("shows correct architecture in table", () => {
    mockUseQueryResponses({
      data: mockBuildData,
      isLoading: false,
      isFetched: true,
      isFetching: false,
      isError: false,
    });

    renderComponent();

    expect(screen.getByRole("gridcell", { name: "arm64" })).toBeInTheDocument();
  });

  test("shows correct build duration in table", () => {
    mockUseQueryResponses({
      data: mockBuildData,
      isLoading: false,
      isFetched: true,
      isFetching: false,
      isError: false,
    });

    renderComponent();

    expect(
      screen.getByRole("gridcell", { name: "14 minutes 47 seconds" }),
    ).toBeInTheDocument();
  });

  test("shows correct result in table", () => {
    mockUseQueryResponses({
      data: mockBuildData,
      isLoading: false,
      isFetched: true,
      isFetching: false,
      isError: false,
    });

    renderComponent();

    expect(
      screen.getByRole("gridcell", { name: "Released" }),
    ).toBeInTheDocument();
  });

  test("shows build log", () => {
    mockUseQueryResponses({
      data: mockBuildData,
      isLoading: false,
      isFetched: true,
      isFetching: false,
      isError: false,
    });

    renderComponent();

    expect(screen.getByText(/Test build logs/)).toBeInTheDocument();
  });

  test("shows build log loading state", () => {
    mockUseQueryResponses(
      {
        data: mockBuildData,
        isLoading: false,
        isFetched: true,
        isFetching: false,
        isError: false,
      },
      {
        data: undefined,
        isLoading: true,
        isFetched: false,
        isFetching: true,
        isError: false,
      },
    );

    renderComponent();

    expect(screen.getByText(/Loading build log/)).toBeInTheDocument();
  });

  test("shows build log error", () => {
    mockUseQueryResponses(
      {
        data: mockBuildData,
        isLoading: false,
        isFetched: true,
        isFetching: false,
        isError: false,
      },
      {
        data: undefined,
        isLoading: false,
        isFetched: true,
        isFetching: false,
        isError: true,
      },
    );

    renderComponent();

    expect(
      screen.getByText(/There was a problem trying to fetch build logs/),
    ).toBeInTheDocument();
  });
});
