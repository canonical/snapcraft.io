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
          setShowErrorNotification={vi.fn()}
          setShowNotification={vi.fn()}
        />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

describe("CreateModelForm", () => {
  it("disables 'Add model' button if no new model name or API key", async () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Add model" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("disables 'Add model' button if new model name but no API key", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(
      screen.getByRole("textbox", { name: "Name" }),
      "test-model-name",
    );
    expect(screen.getByRole("button", { name: "Add model" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("disables 'Add model' button if new API key but no new model name", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(
      screen.getByRole("textbox", { name: "API key" }),
      "AJXdC7aAMrQfElvccQAV0lPkJ0bEnmdjDxuL6C1Di0kxILmiyk",
    );
    expect(screen.getByRole("button", { name: "Add model" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("enables 'Add model' button if there is a new model name and API key", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(
      screen.getByRole("textbox", { name: "Name" }),
      "test-model-name",
    );
    await user.type(
      screen.getByRole("textbox", { name: "API key" }),
      "AJXdC7aAMrQfElvccQAV0lPkJ0bEnmdjDxuL6C1Di0kxILmiyk",
    );
    expect(
      screen.getByRole("button", { name: "Add model" }),
    ).not.toHaveAttribute("aria-disabled");
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
