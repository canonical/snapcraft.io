import React from "react";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import Models from "./Models";

let mockFilterQuery = "model-1";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useSearchParams: () => [new URLSearchParams({ filter: mockFilterQuery })],
  };
});

function renderComponent() {
  return render(
    <RecoilRoot>
      <BrowserRouter>
        <Models />
      </BrowserRouter>
    </RecoilRoot>
  );
}

describe("Models", () => {
  it("displays a link to create a new model", () => {
    renderComponent();
    expect(
      screen.getByRole("link", { name: "Create new model" })
    ).toBeInTheDocument();
  });

  it("shows a create model form when  'Create new model' button clicked", () => {
    const user = userEvent.setup();
    renderComponent();
    user.click(screen.getByRole("link", { name: "Create new model" }));
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

  it("disables 'Add model' button if no new model name", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("link", { name: "Create new model" }));
    expect(screen.getByRole("button", { name: "Add model" })).toBeDisabled();
  });

  it("enables 'Add model' button if there is a new model name", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("link", { name: "Create new model" }));
    await user.type(
      screen.getByRole("textbox", { name: "Name" }),
      "test-model-name"
    );
    expect(
      screen.getByRole("button", { name: "Add model" })
    ).not.toBeDisabled();
  });

  it("generates an API key when clicking 'Generate key'", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("link", { name: "Create new model" }));
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    const input: HTMLInputElement = screen.getByRole("textbox", {
      name: "API key",
    });
    expect(input.value.length).toEqual(50);
  });

  it("displays a filter input", () => {
    renderComponent();
    expect(screen.getByLabelText("Search models")).toBeInTheDocument();
  });

  it("populates filter with the filter query parameter", () => {
    renderComponent();
    expect(screen.getByLabelText("Search models")).toHaveValue(mockFilterQuery);
  });

  it("displays a table of models", () => {
    renderComponent();
    expect(screen.getByTestId("models-table")).toBeInTheDocument();
  });
});
