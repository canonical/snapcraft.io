import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NotAuthorized from "./NotAuthorized";

test("the page should have the correct title", () => {
  render(<NotAuthorized />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Not authorized"
  );
});
