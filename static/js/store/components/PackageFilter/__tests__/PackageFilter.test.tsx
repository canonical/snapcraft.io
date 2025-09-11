import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { PackageFilter } from "../PackageFilter";

import { testPackageData } from "../../../test-utils";

const testCategoriesQueryString = "music-and-audio,productivity";

function renderComponent(isDisabled?: boolean) {
  render(
    <BrowserRouter>
      <PackageFilter data={testPackageData} disabled={isDisabled || false} />
    </BrowserRouter>,
  );
}

vi.mock("react-router-dom", async () => {
  return {
    ...(await vi.importActual("react-router-dom")),
    useSearchParams: () => [
      new URLSearchParams({ categories: testCategoriesQueryString }),
    ],
  };
});

describe("PackageFilter", () => {
  test("disabled if fetching data", () => {
    renderComponent(true);
    expect(screen.getByLabelText("Games")).toBeDisabled();
  });

  test("selects categories from query string", () => {
    renderComponent();
    expect(screen.getByLabelText("Music and Audio")).toBeChecked();
    expect(screen.getByLabelText("Productivity")).toBeChecked();
  });
});
