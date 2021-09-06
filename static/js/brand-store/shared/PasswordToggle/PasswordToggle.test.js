import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import PasswordToggle from "./PasswordToggle";

const testProps = {
  id: "foo",
  label: "Password",
  value: "asdfasdfsdafsda",
  readOnly: false,
};

test("it renders the label", () => {
  render(<PasswordToggle {...testProps} />);
  expect(screen.getByText(testProps.label)).toBeInTheDocument();
});

test("it has the correct value in the password field", () => {
  render(<PasswordToggle {...testProps} />);
  expect(screen.getByLabelText(testProps.label).value).toEqual(testProps.value);
});

test("it shows the correct button text when password is hidden", () => {
  render(<PasswordToggle {...testProps} />);
  expect(screen.getByTestId("show-button")).toBeInTheDocument();
  expect(screen.queryByTestId("hide-button")).not.toBeInTheDocument();
});

test("it shows the correct button text when password is visible", () => {
  render(<PasswordToggle {...testProps} />);
  fireEvent.click(screen.getByTestId("show-button"));
  expect(screen.getByTestId("hide-button")).toBeInTheDocument();
  expect(screen.queryByTestId("show-button")).not.toBeInTheDocument();
});

test("it shows the hide icon when the password is visible", () => {
  render(<PasswordToggle {...testProps} />);
  expect(screen.getByTestId("show-icon")).toBeInTheDocument();
  expect(screen.queryByTestId("hide-icon")).not.toBeInTheDocument();
});

test("it shows the show icon when the password is hidden", () => {
  render(<PasswordToggle {...testProps} />);
  fireEvent.click(screen.getByTestId("show-button"));
  expect(screen.getByTestId("hide-icon")).toBeInTheDocument();
  expect(screen.queryByTestId("show-icon")).not.toBeInTheDocument();
});

test("it has the correct input type when password is hidden", () => {
  render(<PasswordToggle {...testProps} />);
  expect(screen.getByLabelText(testProps.label).type).toEqual("password");
});

test("it has the correct input type when password is visible", () => {
  render(<PasswordToggle {...testProps} />);
  fireEvent.click(screen.getByTestId("show-button"));
  expect(screen.getByLabelText(testProps.label).type).toEqual("text");
});

test("it has the correct input type when toggled back to hidden", () => {
  render(<PasswordToggle {...testProps} />);
  fireEvent.click(screen.getByTestId("show-button"));
  fireEvent.click(screen.getByTestId("hide-button"));
  expect(screen.getByLabelText(testProps.label).type).toEqual("password");
});
