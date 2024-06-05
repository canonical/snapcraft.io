import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import SaveAndPreview from "./SaveAndPreview";

test("the 'Revert' button is disabled by default", () => {
  render(
    <SaveAndPreview
      snapName="test-snap-name"
      isDirty={false}
      reset={jest.fn()}
      isSaving={false}
      isValid={true}
    />
  );
  expect(screen.getByRole("button", { name: "Revert" })).toBeDisabled();
});

test("the 'Revert' button is enabled is data is dirty", () => {
  render(
    <SaveAndPreview
      snapName="test-snap-name"
      isDirty={true}
      reset={jest.fn()}
      isSaving={false}
      isValid={true}
    />
  );
  expect(screen.getByRole("button", { name: "Revert" })).not.toBeDisabled();
});

test("the 'Save' button is disabled by default", () => {
  render(
    <SaveAndPreview
      snapName="test-snap-name"
      isDirty={false}
      reset={jest.fn()}
      isSaving={false}
      isValid={true}
    />
  );
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
});

test("the 'Save' button is enabled is data is dirty", () => {
  render(
    <SaveAndPreview
      snapName="test-snap-name"
      isDirty={true}
      reset={jest.fn()}
      isSaving={false}
      isValid={true}
    />
  );
  expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
});

test("the 'Save' button shows loading state if saving", () => {
  render(
    <SaveAndPreview
      snapName="test-snap-name"
      isDirty={true}
      reset={jest.fn()}
      isSaving={true}
      isValid={true}
    />
  );
  expect(screen.getByRole("button", { name: "Saving" })).toBeInTheDocument();
});

test("the 'Save' button is disabled when saving", () => {
  render(
    <SaveAndPreview
      snapName="test-snap-name"
      isDirty={true}
      reset={jest.fn()}
      isSaving={true}
      isValid={true}
    />
  );
  expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
});

test("the 'Save' button is disabled if the form is invalid", () => {
  render(
    <SaveAndPreview
      snapName="test-snap-name"
      isDirty={false}
      reset={jest.fn()}
      isSaving={false}
      isValid={false}
    />
  );
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
});
