import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import ReviewerAndPublisher from "../ReviewerAndPublisher";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    id: "storeid",
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <ReviewerAndPublisher />
    </BrowserRouter>,
  );
};

describe("ReviewerAndPublisher", () => {
  test("shows the correct page", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { level: 1, name: "Reviewer and publisher" }),
    ).toBeInTheDocument();
  });

  test("links to the correct places", () => {
    window.API_URL = "https://snapcraft.io/";
    renderComponent();
    expect(
      screen.getByRole("link", {
        name: "register a snap name on the Snap store",
      }),
    ).toHaveAttribute("href", "/snaps");
    expect(
      screen.getByRole("link", {
        name: "manage your snaps on the dashboard",
      }),
    ).toHaveAttribute("href", "https://snapcraft.io/stores/snaps/");
    expect(
      screen.getByRole("link", {
        name: "review the snaps in this store on the dashboard",
      }),
    ).toHaveAttribute("href", "https://snapcraft.io/stores/storeid/reviews/");
  });
});
