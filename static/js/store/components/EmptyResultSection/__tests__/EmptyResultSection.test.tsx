import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import EmptyResultSection from "../EmptyResultSection";

const testSearchQuery = "Test search query";

function renderComponent() {
  render(
    <BrowserRouter>
      <EmptyResultSection searchTerm={testSearchQuery} isFetching={false} />
    </BrowserRouter>,
  );
}

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useSearchParams: () => [new URLSearchParams({ q: testSearchQuery })],
  };
});

describe("EmptyResultSection", () => {
  test("displays search query on the page", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", {
        name: `Search results for "${testSearchQuery}"`,
      }),
    ).toBeInTheDocument();
  });

  test("search input shows search query", () => {
    renderComponent();
    expect(screen.getByRole("searchbox")).toHaveValue(testSearchQuery);
  });

  test("links to explore featured snaps", () => {
    renderComponent();
    expect(
      screen.getByRole("link", {
        name: "Explore featured snaps",
      }),
    ).toBeInTheDocument();
  });

  test("links to contact page", () => {
    renderComponent();
    expect(
      screen.getByRole("link", {
        name: "Contact us",
      }),
    ).toBeInTheDocument();
  });
});
