import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import CategoriesInput from "./CategoriesInput";

const props = {
  register: jest.fn(),
  getFieldState: () => {
    return {
      invalid: false,
    };
  },
  primaryCategory: "productivity",
  secondaryCategory: "",
  setValue: jest.fn(),
  categories: [
    { slug: "development", name: "Development" },
    { slug: "education", name: "Education" },
    { slug: "finance", name: "Finance" },
    { slug: "productivity", name: "Productivity" },
    { slug: "security", name: "Security" },
  ],
};

jest.mock("nanoid", () => {
  return { nanoid: () => `abcd-${Math.random() * (999 - 100 + 1) + 100}` };
});

test("the correct primary category is selected", () => {
  render(<CategoriesInput {...props} />);
  expect(screen.getByRole("combobox", { name: "Category:" })).toHaveValue(
    "productivity"
  );
});

test("the correct secondary category is selected", () => {
  render(<CategoriesInput {...props} secondaryCategory="development" />);
  expect(
    screen.getByRole("combobox", { name: "Second category:" })
  ).toHaveValue("development");
});

test("the primary category option is disabled in the secondary field", () => {
  render(<CategoriesInput {...props} secondaryCategory="development" />);
  expect(
    screen
      .getByRole("combobox", { name: "Second category:" })
      .querySelector("option[value='productivity']")
  ).toBeDisabled();
});

test("the secondary category option is disabled in the primary field", () => {
  render(<CategoriesInput {...props} secondaryCategory="development" />);
  expect(
    screen
      .getByRole("combobox", { name: "Category:" })
      .querySelector("option[value='development']")
  ).toBeDisabled();
});

test("the second category field is not present if no second category", () => {
  render(<CategoriesInput {...props} />);
  expect(
    screen.queryByRole("combobox", { name: "Second category:" })
  ).not.toBeInTheDocument();
});

test("the second category field is present if there is second category", () => {
  render(<CategoriesInput {...props} secondaryCategory="development" />);
  expect(
    screen.getByRole("combobox", { name: "Second category:" })
  ).toBeInTheDocument();
});

test("the add category button adds the second category field", () => {
  render(<CategoriesInput {...props} />);

  expect(
    screen.queryByRole("combobox", { name: "Second category:" })
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByTestId("add-category-button"));

  expect(
    screen.getByRole("combobox", { name: "Second category:" })
  ).toBeInTheDocument();
});

test("the remove category button removes the second category field", () => {
  render(<CategoriesInput {...props} secondaryCategory="development" />);

  expect(
    screen.getByRole("combobox", { name: "Second category:" })
  ).toBeInTheDocument();

  fireEvent.click(screen.getByTestId("delete-category-button"));

  expect(
    screen.queryByRole("combobox", { name: "Second category:" })
  ).not.toBeInTheDocument();
});
