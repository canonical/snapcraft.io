import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { FormEvent } from "react";

import SaveAndPreview from "./SaveAndPreview";

const reset = vi.fn();

const renderComponent = (
  isDirty: boolean,
  isSaving: boolean,
  isValid: boolean,
  showPreview = false,
) => {
  return render(
    <SaveAndPreview
      snapName="test-snap-name"
      isDirty={isDirty}
      reset={reset}
      isSaving={isSaving}
      isValid={isValid}
      showPreview={showPreview}
    />,
  );
};

beforeEach(() => {
  reset.mockClear();
});

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

test("preview action revert resets the form", () => {
  render(
    <form>
      <SaveAndPreview
        snapName="test-snap-name"
        isDirty={true}
        reset={reset}
        isSaving={false}
        isValid={true}
        showPreview={true}
      />
    </form>,
  );

  const previewWindow = { close: vi.fn() } as unknown as Window;

  window.dispatchEvent(
    new MessageEvent("message", {
      data: { type: "snapcraft-preview-action", action: "revert" },
      origin: window.location.origin,
      source: previewWindow,
    }),
  );

  expect(reset).toHaveBeenCalled();
});

test("preview action save submits the form", () => {
  const handleSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
    event.preventDefault(),
  );

  const { container } = render(
    <form onSubmit={handleSubmit}>
      <SaveAndPreview
        snapName="test-snap-name"
        isDirty={true}
        reset={reset}
        isSaving={false}
        isValid={true}
        showPreview={true}
      />
    </form>,
  );

  const previewWindow = { close: vi.fn() } as unknown as Window;

  const form = container.querySelector("form") as HTMLFormElement;
  if (form) {
    Object.defineProperty(form, "requestSubmit", {
      value: undefined,
      writable: true,
    });
  }

  window.dispatchEvent(
    new MessageEvent("message", {
      data: { type: "snapcraft-preview-action", action: "save" },
      origin: window.location.origin,
      source: previewWindow,
    }),
  );

  expect(handleSubmit).toHaveBeenCalled();
});
