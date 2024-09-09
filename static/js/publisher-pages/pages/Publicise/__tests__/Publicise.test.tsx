import { BrowserRouter } from "react-router-dom";
import { screen, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import Publicise from "../Publicise";

const renderComponent = (view?: "badges" | "cards" | undefined) => {
  return render(
    <BrowserRouter>
      <Publicise view={view} />
    </BrowserRouter>
  );
};

window.SNAP_PUBLICISE_DATA = {
  hasScreenshot: true,
  isReleased: true,
  private: false,
  trending: false,
};

beforeEach(() => {
  window.SNAP_PUBLICISE_DATA.private = false;
});

describe("Publicise", () => {
  test("notification if private", () => {
    window.SNAP_PUBLICISE_DATA.private = true;
    renderComponent();
    expect(screen.getByText(/Make your snap public/)).toBeInTheDocument();
  });

  test("disabled if private", () => {
    window.SNAP_PUBLICISE_DATA.private = true;
    renderComponent();
    expect(document.querySelector(".u-disabled")).toBeInTheDocument();
  });

  test("renders section navigation", () => {
    renderComponent();

    expect(
      screen.getByRole("link", { name: "Snap Store buttons" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "GitHub badges" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Embeddable cards" })
    ).toBeInTheDocument();
  });

  test("renders buttons by default", () => {
    renderComponent();
    expect(
      screen.getByText(/You can help translate these buttons/)
    ).toBeInTheDocument();
  });

  test("renders badges if passed argument", () => {
    renderComponent("badges");
    expect(
      screen.getByText(/Stable channel from default track/)
    ).toBeInTheDocument();
  });

  test("renders cards if passed argument", () => {
    renderComponent("cards");
    expect(screen.getByText(/Snap Store button:/)).toBeInTheDocument();
  });
});
