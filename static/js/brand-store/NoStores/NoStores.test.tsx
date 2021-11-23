import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NoStores from "./NoStores";

test("the page should have the correct title", () => {
  render(<NoStores />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "No stores"
  );
});
