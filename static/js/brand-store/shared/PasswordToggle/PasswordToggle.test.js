import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import PasswordToggle from "./PasswordToggle";

let testProps = {};

beforeEach(() => {
  testProps = {
    id: "foo",
    label: "Password",
    value: "asdfasdfsdafsda",
    readOnly: false,
  };
});

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
  expect(screen.getByRole("button")).toHaveTextContent("Show");
});

test("it shows the correct button text when password is visible", () => {
  render(<PasswordToggle {...testProps} />);
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByRole("button")).toHaveTextContent("Hide");
});

test("it shows the show icon when the password is hidden", () => {
  render(<PasswordToggle {...testProps} />);
  expect(document.querySelector(".p-icon--show")).toBeInTheDocument();
  expect(document.querySelector(".p-icon--hide")).not.toBeInTheDocument();
});

test("it shows the hide icon when the password is visible", () => {
  render(<PasswordToggle {...testProps} />);
  fireEvent.click(screen.getByRole("button"));
  expect(document.querySelector(".p-icon--hide")).toBeInTheDocument();
  expect(document.querySelector(".p-icon--show")).not.toBeInTheDocument();
});

test("it has the correct input type when password is hidden", () => {
  render(<PasswordToggle {...testProps} />);
  expect(screen.getByLabelText(testProps.label).type).toEqual("password");
});

test("it has the correct input type when password is visible", () => {
  render(<PasswordToggle {...testProps} />);
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByLabelText(testProps.label).type).toEqual("text");
});

test("it has the correct input type when toggled back to hidden", () => {
  render(<PasswordToggle {...testProps} />);
  fireEvent.click(screen.getByRole("button"));
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByLabelText(testProps.label).type).toEqual("password");
});
