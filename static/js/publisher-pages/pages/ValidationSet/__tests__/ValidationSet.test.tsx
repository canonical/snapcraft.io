import { BrowserRouter, useSearchParams } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    // @ts-ignore
    useQuery.mockReturnValue({ status: "loading", data: undefined });
    // @ts-ignore
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(
      screen.getByText(/Fetching validation set snaps/),
    ).toBeInTheDocument();
  });

  test("shows message if no validation set", () => {
    // @ts-ignore
    useQuery.mockReturnValue({ status: "success", data: [] });
    // @ts-ignore
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(
      screen.getByText(/There are no snaps in this validation set to display/),
    ).toBeInTheDocument();
  });

  test("shows message when there is an error fetching validation set", () => {
    // @ts-ignore
    useQuery.mockReturnValue({ status: "error", data: undefined });
    // @ts-ignore
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(
      screen.getByText(/Unable to load validation set snaps/),
    ).toBeInTheDocument();
  });

  test("displays validation set snaps", () => {
    // @ts-ignore
    useQuery.mockReturnValue({ status: "success", data: mockValidationSet });
    // @ts-ignore
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(
      screen.getByText(mockValidationSet[0].snaps[0].name),
    ).toBeInTheDocument();
  });

  test("sequence selector defaults to latest sequence", () => {
    // @ts-ignore
    useQuery.mockReturnValue({ status: "success", data: mockValidationSet });
    // @ts-ignore
    useSearchParams.mockReturnValue([new URLSearchParams()]);
    renderComponent();
    expect(screen.getByLabelText("Sequence")).toHaveValue("3");
    expect(screen.getByText(/only-in-sequence-3/)).toBeInTheDocument();
  });

  test("sequence selector uses query string value", () => {
    // @ts-ignore
    useQuery.mockReturnValue({ status: "success", data: mockValidationSet });
    // @ts-ignore
    useSearchParams.mockReturnValue([new URLSearchParams({ sequence: "2" })]);
    renderComponent();
    expect(screen.getByLabelText("Sequence")).toHaveValue("2");
    expect(screen.getByText(/only-in-sequence-2/)).toBeInTheDocument();
  });
});
