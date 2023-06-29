import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

import Models from "./Models";

let mockFilterQuery = "model-1";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useSearchParams: () => [new URLSearchParams({ filter: mockFilterQuery })],
  };
});

describe("Models", () => {
  it("displays a filter input", () => {
    render(
      <BrowserRouter>
        <Models />
      </BrowserRouter>
    );
    expect(screen.getByLabelText("Search models")).toBeInTheDocument();
  });

  it("populates filter with the filter query parameter", () => {
    render(
      <BrowserRouter>
        <Models />
      </BrowserRouter>
    );
    expect(screen.getByLabelText("Search models")).toHaveValue(mockFilterQuery);
  });

  it("displays a table of models", () => {
    render(
      <BrowserRouter>
        <Models />
      </BrowserRouter>
    );
    expect(screen.getByTestId("models-table")).toBeInTheDocument();
  });
});
