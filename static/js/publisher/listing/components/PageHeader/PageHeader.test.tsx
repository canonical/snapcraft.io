import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import PageHeader from "./PageHeader";

test("the page displays the correct name for the snap", () => {
  render(<PageHeader snapName="test-snap-name" />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "test-snap-name"
  );
});
