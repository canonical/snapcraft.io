import { BrowserRouter } from "react-router-dom";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import DeveloperAgreement from "../DeveloperAgreement";

function renderComponent() {
  return render(
    <BrowserRouter>
      <DeveloperAgreement />
    </BrowserRouter>,
  );
}

describe("DeveloperAgreement", () => {
  test("'Continue' button is disabled by default", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("'Continue' button is enabled when agreement selected", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(
      screen.getByLabelText("I agree to the terms and privacy notice"),
    );

    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).not.toHaveAttribute("aria-disabled", "true");
  });
});
