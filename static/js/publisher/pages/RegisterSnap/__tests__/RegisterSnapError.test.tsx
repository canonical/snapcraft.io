import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import RegistrationError from "../RegistrationError";

function renderComponent(errorCode: string) {
  return render(
    <BrowserRouter>
      <RegistrationError
        snapName="test-snap-name"
        isPrivate="private"
        store="ubuntu"
        errorCode={errorCode}
      />
    </BrowserRouter>,
  );
}

describe("RegistrationError", () => {
  test("points user to dashboard when registering snap in global store", () => {
    renderComponent("name-review-required");
    expect(
      screen.getByRole("link", {
        name: "https://dashboard.snapcraft.io/register-snap",
      }),
    ).toBeInTheDocument();
  });

  test("informs user if they already own snap", () => {
    renderComponent("already_owned");
    const el = screen.getByText("You already own", { exact: false });
    expect(el.textContent).toEqual("You already own 'test-snap-name'.");
  });

  test("directs user to request a reserved name", () => {
    renderComponent("reserved_name");
    expect(
      screen.getByRole("link", { name: "request a reserved name" }),
    ).toBeInTheDocument();
  });

  test("informs user if no permission to register snap", () => {
    renderComponent("no-permission");
    expect(
      screen.getByText(
        "You do not have permission to register snaps to this store. Contact the store administrator.",
      ),
    ).toBeInTheDocument();
  });

  test("informs user if snap needs to be registered", () => {
    renderComponent("other_error_code");
    expect(
      screen.getByText(
        "Before you can push your snap to the store, its name must be registered",
      ),
    ).toBeInTheDocument();
  });
});
