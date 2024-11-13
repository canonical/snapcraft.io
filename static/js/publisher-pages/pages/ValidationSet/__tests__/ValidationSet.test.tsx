import { BrowserRouter, useSearchParams } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ValidationSet from "../ValidationSet";

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ValidationSet />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

const mockValidationSet = [
  {
    name: "validation-set-1",
    revision: 1,
    sequence: 1,
    snaps: [
      {
        id: "test-snap-1-id",
        name: "test-snap-1",
      },
      {
        id: "test-snap-2-id",
        name: "only-in-sequence-1",
      },
    ],
    timestamp: "2024-08-13T09:49:18Z",
  },
  {
    name: "validation-set-1",
    revision: 1,
    sequence: 2,
    snaps: [
      {
        id: "test-snap-1-id",
        name: "test-snap-1",
      },
      {
        id: "test-snap-2-id",
        name: "only-in-sequence-2",
      },
    ],
    timestamp: "2024-08-14T09:49:18Z",
  },
  {
    name: "validation-set-1",
    revision: 1,
    sequence: 3,
    snaps: [
      {
        id: "test-snap-1-id",
        name: "test-snap-1",
      },
      {
        id: "test-snap-2-id",
        name: "test-snap-2",
      },
      {
        id: "test-snap-3-id",
        name: "only-in-sequence-3",
      },
    ],
    timestamp: "2024-08-15T09:49:18Z",
  },
];

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useSearchParams: jest.fn(),
}));

describe("ValidationSet", () => {
  test("shows loading state when fetching validation set", () => {
    // @ts-expect-error Mocking useQuery with status loading
    useQuery.mockReturnValue({ status: "loading", data: undefined });
    // @ts-expect-error Mocking useSearchParams to return an empty URLSearchParams
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(
      screen.getByText(/Fetching validation set snaps/),
    ).toBeInTheDocument();
  });

  test("shows message if no validation set", () => {
    // @ts-expect-error Mocking useQuery to return an empty array for no validation sets
    useQuery.mockReturnValue({ status: "success", data: [] });
    // @ts-expect-error Mocking useSearchParams to return an empty URLSearchParams for the test
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(
      screen.getByText(/There are no snaps in this validation set to display/),
    ).toBeInTheDocument();
  });

  test("shows message when there is an error fetching validation set", () => {
    // @ts-expect-error Mocking useQuery with an error status to simulate a failed request
    useQuery.mockReturnValue({ status: "error", data: undefined });
    // @ts-expect-error Mocking useSearchParams to return an empty URLSearchParams
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(
      screen.getByText(/Unable to load validation set snaps/),
    ).toBeInTheDocument();
  });

  test("displays validation set snaps", () => {
    // @ts-expect-error Mocking useQuery to return mock data of validation sets
    useQuery.mockReturnValue({ status: "success", data: mockValidationSet });
    // @ts-expect-error Mocking useSearchParams to return an empty URLSearchParams for the test
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(
      screen.getByText(mockValidationSet[0].snaps[0].name),
    ).toBeInTheDocument();
  });

  test("sequence selector defaults to latest sequence", () => {
    // @ts-expect-error Mocking useQuery to return mock data of validation sets
    useQuery.mockReturnValue({ status: "success", data: mockValidationSet });
    // @ts-expect-error Mocking useSearchParams to return an empty URLSearchParams for the test
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(screen.getByLabelText("Sequence")).toHaveValue("3");
    expect(screen.getByText(/only-in-sequence-3/)).toBeInTheDocument();
  });

  test("sequence selector uses query string value", () => {
    // @ts-expect-error Mocking useQuery to return mock data of validation sets
    useQuery.mockReturnValue({ status: "success", data: mockValidationSet });
    // @ts-expect-error Mocking useSearchParams to return a query string value of sequence=2
    useSearchParams.mockReturnValue([new URLSearchParams({ sequence: "2" })]);
    renderComponent();
    expect(screen.getByLabelText("Sequence")).toHaveValue("2");
    expect(screen.getByText(/only-in-sequence-2/)).toBeInTheDocument();
  });
});
