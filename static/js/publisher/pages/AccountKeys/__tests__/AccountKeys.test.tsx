import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import AccountKeys from "../AccountKeys";
import { RecoilRoot } from "recoil";

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <RecoilRoot>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AccountKeys />
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>
  );
};

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

describe("AccountKeys", () => {
  test("shows loading state when fetching keys", () => {
    // @ts-expect-error Mocking useQuery with status loading
    useQuery.mockReturnValue({ status: "loading", data: undefined });

    renderComponent();
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  test("shows message if no keys", () => {
    // @ts-expect-error Mocking useQuery to return an empty array for no keys
    useQuery.mockReturnValue({
      status: "success",
      data: {
        success: true,
        data: [],
      },
    });

    renderComponent();
    expect(
      screen.getByText(/There are no keys associated to your account/)
    ).toBeInTheDocument();
  });

  test("shows keys table on successful response", () => {
    const nowISO = new Date().toISOString();
    // @ts-expect-error Mocking useQuery to return an array of keys
    useQuery.mockReturnValue({
      status: "success",
      data: {
        success: true,
        data: [
          {
            name: "test-key 1",
            "public-key-sha3-384": "test fingerprint 1",
            since: nowISO,
          },
          {
            name: "test-key 2",
            "public-key-sha3-384": "test fingerprint 2",
            since: nowISO,
          },
        ],
      },
    });

    renderComponent();
    expect(screen.getByText(/test fingerprint 1/)).toBeInTheDocument();
    expect(screen.getByText(/test fingerprint 2/)).toBeInTheDocument();
  });

  test("shows message when there is an error fetching keys", () => {
    // @ts-expect-error Mocking useQuery with an error status to simulate a failed request
    useQuery.mockReturnValue({ status: "error", data: undefined });
    renderComponent();
    expect(
      screen.getByText(/Something went wrong. Please try again later./)
    ).toBeInTheDocument();
  });
});
