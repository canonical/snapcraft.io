import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import AccountKeys from "../AccountKeys";

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AccountKeys />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

vi.mock("react-query", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: vi.fn(),
}));

describe("AccountKeys", () => {
  test("shows loading state when fetching keys", () => {
    // @ts-expect-error Mocking useQuery with status loading
    useQuery.mockReturnValue({
      status: "loading",
      isLoading: true,
      data: undefined,
    });

    renderComponent();
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  test("shows message if no keys", () => {
    // @ts-expect-error Mocking useQuery to return an empty array for no keys
    useQuery.mockReturnValue({
      status: "success",
      data: [],
    });

    renderComponent();
    expect(
      screen.getByText(/There are no keys associated to your account/),
    ).toBeInTheDocument();
  });

  test("shows keys table on successful response", () => {
    const nowISO = new Date().toISOString();
    // @ts-expect-error Mocking useQuery to return an array of keys
    useQuery.mockReturnValue({
      status: "success",
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
    });

    renderComponent();
    expect(screen.getByText(/test fingerprint 1/)).toBeInTheDocument();
    expect(screen.getByText(/test fingerprint 2/)).toBeInTheDocument();
    expect(screen.queryByText(/Constraints/)).not.toBeInTheDocument(); // keys in response don't have constraints
  });

  test("shows keys table with constraints", async () => {
    const user = userEvent.setup();
    const nowISO = new Date().toISOString();
    // @ts-expect-error Mocking useQuery to return an array of keys
    useQuery.mockReturnValue({
      status: "success",
      data: [
        {
          name: "test-key constraints 1",
          "public-key-sha3-384": "test fingerprint constraints 1",
          since: nowISO,
          constraints: [
            {
              headers: {
                type: "model",
                model: "test-.*",
              },
            },
            {
              headers: {
                type: "system-user",
                models: ["something", "something-else"],
              },
            },
          ],
        },
      ],
    });

    renderComponent();

    const expandBtn = screen.getByRole("button", {
      name: /Show constraints/,
    });

    expect(
      screen.getByText(/test fingerprint constraints 1/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Constraints/)).toHaveRole("columnheader");
    expect(expandBtn).toBeInTheDocument();
    await waitFor(() => user.click(expandBtn));
    expect(screen.getByText(/Assertion type/)).toHaveRole("columnheader");
  });

  test("shows message when there is an error fetching keys", () => {
    // @ts-expect-error Mocking useQuery with an error status to simulate a failed request
    useQuery.mockReturnValue({
      status: "error",
      isError: true,
      data: undefined,
    });
    renderComponent();
    expect(
      screen.getByText(/Something went wrong. Please try again later./),
    ).toBeInTheDocument();
  });
});
