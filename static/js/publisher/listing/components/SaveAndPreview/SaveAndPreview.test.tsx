import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import SaveAndPreview from "./SaveAndPreview";

test("the 'Revert' button is disabled by default", () => {
  render(
    <SaveAndPreview
      snapName="test-snap-name"
      isDirty={false}
      reset={jest.fn()}
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
    />
  );
  expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
});
