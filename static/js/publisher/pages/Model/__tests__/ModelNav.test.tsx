import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ModelNav from "../ModelNav";

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <ModelNav sectionName="policies" />
    </BrowserRouter>,
  );
};

describe("ModelNav", () => {
  it("highlights the correct navigation item", () => {
    renderComponent();
    const currentLink = screen.getByRole("tab", { name: "Policies" });
    expect(currentLink.getAttribute("aria-selected")).toBe("true");
  });

  it("doesn't highlight other navigation links", () => {
    renderComponent();
    const currentLink = screen.getByRole("tab", { name: "Overview" });
    expect(currentLink.getAttribute("aria-selected")).toBe("false");
  });
});
