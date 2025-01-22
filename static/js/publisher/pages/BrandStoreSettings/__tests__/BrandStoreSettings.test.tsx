import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecoilRoot } from "recoil";
import { QueryClientProvider, QueryClient, useQuery } from "react-query";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import BrandStoreSettings from "../BrandStoreSettings";

const queryClient = new QueryClient();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    id: "store-id",
  }),
}));

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

const renderComponent = () => {
  render(
    <RecoilRoot>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <BrandStoreSettings />
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>,
  );
};

describe("BrandStoreSettings", () => {
  test("Shows loading state", () => {
    // @ts-expect-error Mocking useQuery for test data
    useQuery.mockReturnValue({
      status: "success",
      isLoading: true,
      data: {
        "manual-review-policy": "allow",
      },
    });
    renderComponent();

    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  test("'Include this store in public lists' is checked", () => {
    // @ts-expect-error Mocking useQuery for test data
    useQuery.mockReturnValue({
      status: "success",
      isLoading: false,
      data: {
        private: false,
      },
    });
    renderComponent();

    expect(
      screen.getByLabelText("Include this store in public lists"),
    ).toBeChecked();
  });

  test("'Include this store in public lists' is not checked", () => {
    // @ts-expect-error Mocking useQuery for test data
    useQuery.mockReturnValue({
      status: "success",
      isLoading: false,
      data: {
        private: true,
      },
    });
    renderComponent();

    expect(
      screen.getByLabelText("Include this store in public lists"),
    ).not.toBeChecked();
  });

  test("'Store ID' is populated", () => {
    // @ts-expect-error Mocking useQuery for test data
    useQuery.mockReturnValue({
      status: "success",
      isLoading: false,
      data: {},
    });
    renderComponent();

    expect(screen.getByLabelText("Store ID")).toHaveAttribute(
      "type",
      "password",
    );
  });

  test("'Store ID' is visible if 'Show' button is selected", async () => {
    // @ts-expect-error Mocking useQuery for test data
    useQuery.mockReturnValue({
      status: "success",
      isLoading: false,
      data: {},
    });
    renderComponent();

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Show/ }));

    expect(screen.getByLabelText("Store ID")).toHaveValue("store-id");
  });

  test("'Manual review policy' is set to 'Allow'", () => {
    // @ts-expect-error Mocking useQuery for test data
    useQuery.mockReturnValue({
      status: "success",
      isLoading: false,
      data: {
        "manual-review-policy": "allow",
      },
    });
    renderComponent();

    expect(screen.getByLabelText(/Allow/)).toBeChecked();
  });

  test("'Manual review policy' is set to 'Avoid'", () => {
    // @ts-expect-error Mocking useQuery for test data
    useQuery.mockReturnValue({
      status: "success",
      isLoading: false,
      data: {
        "manual-review-policy": "avoid",
      },
    });
    renderComponent();

    expect(screen.getByLabelText(/Avoid/)).toBeChecked();
  });

  test("'Manual review policy' is set to 'Require'", () => {
    // @ts-expect-error Mocking useQuery for test data
    useQuery.mockReturnValue({
      status: "success",
      isLoading: false,
      data: {
        "manual-review-policy": "require",
      },
    });
    renderComponent();

    expect(screen.getByLabelText(/Require/)).toBeChecked();
  });
});
