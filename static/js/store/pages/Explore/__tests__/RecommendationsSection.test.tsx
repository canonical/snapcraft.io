import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import RecommendationsSection from "../RecommendationsSection";

import { mockRecommendations } from "../../../test-utils";

function renderComponent() {
  return render(
    <RecommendationsSection
      snaps={mockRecommendations}
      title="Section title"
    />,
  );
}
describe("RecommendationsSection", () => {
  test("displays title", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { level: 2, name: "Section title" }),
    ).toBeInTheDocument();
  });

  test("renders the correct number of cards", () => {
    renderComponent();
    expect(
      screen.getAllByRole("heading", { level: 2, name: /Test snap title/ }),
    ).toHaveLength(6);
  });
});
