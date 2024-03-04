import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import Models from "./Models";
import { store } from "../../store";

let mockFilterQuery = "model-1";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useSearchParams: () => [new URLSearchParams({ filter: mockFilterQuery })],
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function renderComponent() {
  return render(
    <Provider store={store}>
      <RecoilRoot>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <Models />
          </QueryClientProvider>
        </BrowserRouter>
      </RecoilRoot>
    </Provider>
  );
}

describe("Models", () => {
  it("displays a link to create a new model", () => {
    renderComponent();
    expect(
      screen.getByRole("link", { name: "Create new model" })
    ).toBeInTheDocument();
  });

  it("shows a create model form when 'Create new model' button clicked", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("link", { name: "Create new model" }));
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "API key" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate key" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add model" })
    ).toBeInTheDocument();
  });

  it("displays a filter input", () => {
    renderComponent();
    expect(screen.getByLabelText("Search models")).toBeInTheDocument();
  });

  it("populates filter with the filter query parameter", () => {
    renderComponent();
    expect(screen.getByLabelText("Search models")).toHaveValue(mockFilterQuery);
  });
});
