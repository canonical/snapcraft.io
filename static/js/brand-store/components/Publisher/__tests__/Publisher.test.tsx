import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import Publisher from "../Publisher";

const renderComponent = () => {
  render(<Publisher />);
};

describe("Publisher", () => {
  test("shows the correct page", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { level: 1, name: "Publisher" })
    ).toBeInTheDocument();
  });

  test("links to the correct places", () => {
    window.API_URL = "https://snapcraft.io/";
    renderComponent();
    expect(
      screen.getByRole("link", {
        name: "register a snap name on the Snap store",
      })
    ).toHaveAttribute("href", "/snaps");
    expect(
      screen.getByRole("link", {
        name: "manage your snaps on the dashboard",
      })
    ).toHaveAttribute("href", "https://snapcraft.io/stores/snaps/");
  });
});
