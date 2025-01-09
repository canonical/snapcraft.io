import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import AccountSnaps from "../AccountSnaps";

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AccountSnaps />
    </QueryClientProvider>,
  );
};

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

describe("AccountSnaps", () => {
  test("shows loading state when fetching validation set", () => {
    // @ts-expect-error Mocking useQuery with status loading
    useQuery.mockReturnValue({ status: "loading", data: undefined });

    renderComponent();
    expect(screen.getByText(/Fetching snaps/)).toBeInTheDocument();
  });

  test("shows message if no validation set", () => {
    // @ts-expect-error Mocking useQuery to return an empty array for no validation sets
    useQuery.mockReturnValue({
      status: "success",
      data: {
        snaps: [],
        registeredSnaps: [],
      },
    });

    renderComponent();
    expect(screen.getByText(/Get started…/)).toBeInTheDocument();
  });

  test("shows message when there is an error fetching validation set", () => {
    // @ts-expect-error Mocking useQuery with an error status to simulate a failed request
    useQuery.mockReturnValue({ status: "error", data: undefined });
    renderComponent();
    expect(
      screen.getByText(/Something went wrong. Please try again later./),
    ).toBeInTheDocument();
  });
});
