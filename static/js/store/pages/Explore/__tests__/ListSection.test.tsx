import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ListSection from "../ListSection";

import { mockRecommendations } from "../../../test-utils";

function renderComponent(isLoading?: boolean) {
  return render(
    <ListSection
      isLoading={isLoading || false}
      snaps={mockRecommendations}
      title="Section title"
    />,
  );
}
describe("ListSection", () => {
  test("displays title if loading", () => {
    renderComponent(true);
    expect(
      screen.getByRole("heading", { level: 2, name: "Section title" }),
    ).toBeInTheDocument();
  });

  test("displays title if not loading", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { level: 2, name: "Section title" }),
    ).toBeInTheDocument();
  });

  test("renders the correct number of cards", () => {
    renderComponent();
    expect(
      screen.getAllByRole("heading", { level: 3, name: /Test snap title/ }),
    ).toHaveLength(6);
  });
});
