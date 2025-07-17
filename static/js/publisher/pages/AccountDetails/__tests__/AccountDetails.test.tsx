import { screen, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";

import AccountDetails from "../AccountDetails";

import { JotaiTestProvider, publisherResponse } from "../../../test-utils";
import { publisherState } from "../../../state/publisherState";

const queryClient = new QueryClient();

const renderComponent = () => {
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <JotaiTestProvider
          initialValues={[[publisherState, publisherResponse]]}
        >
          <AccountDetails />
        </JotaiTestProvider>
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

describe("AccountDetails", () => {
  test("renders correct page", async () => {
    renderComponent();
    const component = await waitFor(() => {
      return screen.getByRole("heading", { level: 2, name: "Account details" });
    });
    expect(component).toBeInTheDocument();
  });

  test("displays edit button", async () => {
    renderComponent();
    const component = await waitFor(() => {
      return screen.getByRole("link", { name: /Edit details/ });
    });
    expect(component).toBeInTheDocument();
  });
});
