import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import SaveAndPreview from "./SaveAndPreview";

const reset = jest.fn();

const renderComponent = (
  isDirty: boolean,
  isSaving: boolean,
  isValid: boolean,
) => {
  return render(
    <SaveAndPreview
      snapName="test-snap-name"
      isDirty={isDirty}
      reset={reset}
      isSaving={isSaving}
      isValid={isValid}
    />,
  );
};

test("the 'Revert' button is disabled by default", () => {
  renderComponent(false, false, true);
  expect(screen.getByRole("button", { name: "Revert" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("the 'Revert' button is enabled is data is dirty", () => {
  renderComponent(true, false, true);
  expect(screen.getByRole("button", { name: "Revert" })).not.toBeDisabled();
});

test("the 'Save' button is disabled by default", () => {
  renderComponent(false, false, true);
  expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("the 'Save' button is enabled is data is dirty", () => {
  renderComponent(true, false, true);
  expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
});

test("the 'Save' button shows loading state if saving", () => {
  renderComponent(true, true, true);
  expect(screen.getByRole("button", { name: "Saving" })).toBeInTheDocument();
});

test("the 'Save' button is disabled when saving", () => {
  renderComponent(true, true, true);
  expect(screen.getByRole("button", { name: "Saving" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("the 'Save' button is disabled if the form is invalid", () => {
  renderComponent(false, false, false);
  expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("revert button resets the form", async () => {
  const user = userEvent.setup();
  renderComponent(true, false, true);
  await user.click(screen.getByRole("button", { name: "Revert" }));
  await waitFor(() => {
    expect(reset).toHaveBeenCalled();
  });
});
