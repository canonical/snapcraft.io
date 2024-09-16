import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import App from "../App";

import { mockData } from "../../../test-utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    snapName: "test-snap",
  }),
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe("App", () => {
  test("renders page header", () => {
    // @ts-ignore
    useQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      refetch: jest.fn(),
    });

    renderComponent();

    expect(
      screen.getByRole("heading", { level: 1, name: "test-snap" })
    ).toBeInTheDocument();
  });

  test("renders loading state", () => {
    // @ts-ignore
    useQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      refetch: jest.fn(),
    });

    renderComponent();

    expect(
      screen.getByText(/Loading test-snap listing data/)
    ).toBeInTheDocument();
  });

  test("renders listing details section", () => {
    // @ts-ignore
    useQuery.mockReturnValue({
      isLoading: false,
      data: mockData,
      refetch: jest.fn(),
    });

    renderComponent();

    expect(
      screen.getByRole("heading", { level: 2, name: "Listing details" })
    ).toBeInTheDocument();
  });

  test("renders contact section", () => {
    // @ts-ignore
    useQuery.mockReturnValue({
      isLoading: false,
      data: mockData,
      refetch: jest.fn(),
    });

    renderComponent();

    expect(
      screen.getByRole("heading", { level: 2, name: "Contact information" })
    ).toBeInTheDocument();
  });

  test("renders additional information section", () => {
    // @ts-ignore
    useQuery.mockReturnValue({
      isLoading: false,
      data: mockData,
      refetch: jest.fn(),
    });

    renderComponent();

    expect(
      screen.getByRole("heading", { level: 2, name: "Additional information" })
    ).toBeInTheDocument();
  });

  test("shows 'Update metadata' notification", () => {
    // @ts-ignore
    useQuery.mockReturnValue({
      isLoading: false,
      data: { ...mockData, update_metadata_on_release: true },
      refetch: jest.fn(),
    });

    renderComponent();

    expect(
      screen.getByText(
        /Information here was automatically updated to the latest version of the snapcraft.yaml released to the stable channel/
      )
    ).toBeInTheDocument();
  });

  test("doesn't show 'Update metadata' nofitication", () => {
    // @ts-ignore
    useQuery.mockReturnValue({
      isLoading: false,
      data: mockData,
      refetch: jest.fn(),
    });

    renderComponent();

    expect(
      screen.queryByText(
        /Information here was automatically updated to the latest version of the snapcraft.yaml released to the stable channel/
      )
    ).not.toBeInTheDocument();
  });
});
