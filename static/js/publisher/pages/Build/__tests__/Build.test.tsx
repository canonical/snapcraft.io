import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import Build from "../Build";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useParams: () => ({
      buildId: "test-build-id",
      snapId: "test-snap-id",
    }),
  };
});

const queryClient = new QueryClient();

const mockBuildData = {
  raw_logs: "Test build logs",
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

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
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

describe("Build", () => {
  test("shows loading state", () => {
    // @ts-expect-error - Mocking useQuery response
    useQuery.mockReturnValue({
      data: mockBuildData,
      isLoading: true,
      isFetched: false,
      isFetching: true,
    });

    renderComponent();

    expect(
      screen.getByText(/Loading test-snap-id build data/),
    ).toBeInTheDocument();
  });

  test("shows correct build ID in table", () => {
    // @ts-expect-error - Mocking useQuery response
    useQuery.mockReturnValue({
      data: mockBuildData,
      isLoading: false,
      isFetched: true,
      isFetching: false,
    });

    renderComponent();

    expect(
      screen.getByRole("gridcell", { name: "test-build-id" }),
    ).toBeInTheDocument();
  });

  test("shows correct architecture in table", () => {
    // @ts-expect-error - Mocking useQuery response
    useQuery.mockReturnValue({
      data: mockBuildData,
      isLoading: false,
      isFetched: true,
      isFetching: false,
    });

    renderComponent();

    expect(screen.getByRole("gridcell", { name: "arm64" })).toBeInTheDocument();
  });

  test("shows correct build duration in table", () => {
    // @ts-expect-error - Mocking useQuery response
    useQuery.mockReturnValue({
      data: mockBuildData,
      isLoading: false,
      isFetched: true,
      isFetching: false,
    });

    renderComponent();

    expect(
      screen.getByRole("gridcell", { name: "14 minutes 47 seconds" }),
    ).toBeInTheDocument();
  });

  test("shows correct result in table", () => {
    // @ts-expect-error - Mocking useQuery response
    useQuery.mockReturnValue({
      data: mockBuildData,
      isLoading: false,
      isFetched: true,
      isFetching: false,
    });

    renderComponent();

    expect(
      screen.getByRole("gridcell", { name: "Released" }),
    ).toBeInTheDocument();
  });

  test("shows build log", () => {
    // @ts-expect-error - Mocking useQuery response
    useQuery.mockReturnValue({
      data: mockBuildData,
      isLoading: false,
      isFetched: true,
      isFetching: false,
    });

    renderComponent();

    expect(screen.getByText(/Test build logs/)).toBeInTheDocument();
  });
});
