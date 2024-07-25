import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import App from "../App";

import mockListingData from "../mocks/mockListingData";

const queryClient = new QueryClient();

const renderComponent = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );

window.listingData = mockListingData;
window.tourSteps = mockListingData.tour_steps;

describe("App", () => {
  it("shows 'Save' button as disabled by default", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("shows 'Revert' button as disabled by default", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Revert" })).toBeDisabled();
  });

  it("enables 'Save' button if a change is made to the form", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(
      screen.getByRole("textbox", { name: "Title:" }),
      "new-name",
    );
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  it("enables 'Revert' button if a change is made to the form", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(
      screen.getByRole("textbox", { name: "Title:" }),
      "new-name",
    );
    expect(screen.getByRole("button", { name: "Revert" })).not.toBeDisabled();
  });

  it("disables 'Save' button if a change is made to the form and then reset", async () => {
    const user = userEvent.setup();
    renderComponent();
    const input = screen.getByRole("textbox", { name: "Title:" });
    await user.type(input, "new-name");
    await user.clear(input);
    await user.type(input, mockListingData.snap_title);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("disables 'Revert' button if a change is made to the form and then reset", async () => {
    const user = userEvent.setup();
    renderComponent();
    const input = screen.getByRole("textbox", { name: "Title:" });
    await user.type(input, "new-name");
    await user.clear(input);
    await user.type(input, mockListingData.snap_title);
    expect(screen.getByRole("button", { name: "Revert" })).toBeDisabled();
  });
});
