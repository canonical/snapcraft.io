import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import CreateModelForm from "../CreateModelForm";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <CreateModelForm
          setShowErrorNotification={jest.fn()}
          setShowNotification={jest.fn()}
        />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

describe("CreateModelForm", () => {
  it("disables 'Add model' button if no new model name", async () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Add model" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("enables 'Add model' button if there is a new model name", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(
      screen.getByRole("textbox", { name: "Name" }),
      "test-model-name",
    );
    expect(
      screen.getByRole("button", { name: "Add model" }),
    ).not.toBeDisabled();
  });

  it("generates an API key when clicking 'Generate key'", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    const input: HTMLInputElement = screen.getByRole("textbox", {
      name: "API key",
    });
    expect(input.value.length).toEqual(50);
  });
});
