import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import Reviewer from "../Reviewer";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    id: "storeid",
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <Reviewer />
    </BrowserRouter>,
  );
};

describe("Reviewer", () => {
  test("shows the correct page", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { level: 1, name: "Reviewer" }),
    ).toBeInTheDocument();
  });

  test("links to the correct places", () => {
    window.API_URL = "https://snapcraft.io/";
    renderComponent();
    expect(
      screen.getByRole("link", {
        name: "review the snaps in this store on the dashboard",
      }),
    ).toHaveAttribute("href", "https://snapcraft.io/stores/storeid/reviews/");
  });
});
