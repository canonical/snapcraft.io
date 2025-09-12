import { BrowserRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import RegisterSnapForm from "../RegisterSnapForm";

function renderComponent() {
  const props = {
    isSending: false,
    setIsSending: vi.fn(),
    setRegistrationResponse: vi.fn(),
    availableStores: [],
    selectedStore: "global",
    setSelectedStore: vi.fn(),
  };

  return render(
    <BrowserRouter>
      <RegisterSnapForm {...props} />
    </BrowserRouter>,
  );
}

describe("RegisterSnapForm", () => {
  test("form disabled if no snap name", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: "Register" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("form disabled if snap name longer than 40 characters", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(
      screen.getByLabelText("Snap name"),
      "thisisalongsnapnamethatislongerthan40characters",
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Register" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });

  test("form disabled if snap name contains uppercase characters", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Snap name"), "Test");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Register" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });

  test("form disabled if snap name contains no letters", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Register" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("form disabled if snap name starts with hyphen", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Snap name"), "-test-snap");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Register" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });

  test("form disabled if snap name ends with hyphen", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Snap name"), "test-snap-");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Register" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });

  test("form enabled if snap name meets requirements", async () => {
    // Requirements are:
    // - Less than 40 characters
    // - Only lowercase letters, numbers and hyphens
    // - At least one letter
    // - Doesn't start or end with hyphen
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Snap name"), "test-snap-name-1");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Register" }),
      ).not.toHaveAttribute("aria-disabled");
    });
  });
});
