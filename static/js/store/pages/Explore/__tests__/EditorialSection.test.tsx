import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import EditorialSection from "../EditorialSection";

function renderComponent() {
  return render(
    <EditorialSection
      isLoading={false}
      slice={{
        slice: {
          name: "Test slice name",
          id: "test-slice-id",
          description: "Test slice description",
        },
        snaps: [
          {
            name: "test-snap-1",
            title: "Test snap 1",
            icon: "https://example.com/icon.jpg",
          },
          {
            name: "test-snap-2",
            title: "Test snap 2",
            icon: "https://example.com/icon.jpg",
          },
          {
            name: "test-snap-3",
            title: "Test snap 3",
            icon: "https://example.com/icon.jpg",
          },
        ],
      }}
      gradient="blueGreen"
    />,
  );
}

describe("EditorialSection", () => {
  test("displays title", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { level: 2, name: "Test slice name" }),
    ).toBeInTheDocument();
  });

  test("displays description", () => {
    renderComponent();
    expect(screen.getByText("Test slice description")).toBeInTheDocument();
  });

  test("displays icon", () => {
    renderComponent();
    expect(screen.getByAltText("Test snap 2")).toBeInTheDocument();
  });
});
