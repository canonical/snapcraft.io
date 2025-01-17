import { BrowserRouter, useSearchParams } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ValidationSets from "../ValidationSets";

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ValidationSets />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

const mockValidationSets = [
  {
    name: "validation-set-1",
    revision: 1,
    sequence: 1,
    snaps: [
      {
        id: "test-snap-1-id",
        name: "test-snap-1",
      },
    ],
    timestamp: "2024-08-13T09:49:18Z",
  },
  {
    name: "validation-set-2",
    revision: 1,
    sequence: 2,
    snaps: [
      {
        id: "test-snap-1-id",
        name: "test-snap-1",
      },
    ],
    timestamp: "2024-08-13T09:49:18Z",
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

describe("ValidationSets", () => {
  test("shows loading state when fetching validation sets", () => {
    // @ts-expect-error Mocking useQuery to simulate loading state
    useQuery.mockReturnValue({ status: "loading", data: undefined });
    // @ts-expect-error Mocking useSearchParams to return an empty URLSearchParams for test purposes
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(screen.getByText(/Fetching validation sets/)).toBeInTheDocument();
  });

  test("shows message if no validation sets", () => {
    // @ts-expect-error Mocking useQuery to return an empty array to simulate no data
    useQuery.mockReturnValue({ status: "success", data: [] });
    // @ts-expect-error Mocking useSearchParams to return an empty URLSearchParams for the test
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(
      screen.getByText(/There are no validation sets to display/),
    ).toBeInTheDocument();
  });

  test("shows message when there is an error fetching validation sets", () => {
    // @ts-expect-error Mocking useQuery with error status to simulate a failed fetch
    useQuery.mockReturnValue({ status: "error", data: undefined });
    // @ts-expect-error Mocking useSearchParams to return an empty URLSearchParams
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(
      screen.getByText(/Unable to load validation sets/),
    ).toBeInTheDocument();
  });

  test("displays validation sets", () => {
    // @ts-expect-error Mocking useQuery to return mock validation set data
    useQuery.mockReturnValue({ status: "success", data: mockValidationSets });
    // @ts-expect-error Mocking useSearchParams to return an empty URLSearchParams
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(screen.getByText(mockValidationSets[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockValidationSets[1].name)).toBeInTheDocument();
  });

  test("filters validation sets based on search query", () => {
    // @ts-expect-error Mocking useQuery to return mock data for filter testing
    useQuery.mockReturnValue({ status: "success", data: mockValidationSets });
    // @ts-expect-error Mocking useSearchParams with a filter query to test filtering logic
    useSearchParams.mockReturnValue([new URLSearchParams({ filter: "set-2" })]);
    renderComponent();
    expect(screen.getByText(mockValidationSets[1].name)).toBeInTheDocument();
    expect(
      screen.queryByText(mockValidationSets[0].name),
    ).not.toBeInTheDocument();
  });
});
