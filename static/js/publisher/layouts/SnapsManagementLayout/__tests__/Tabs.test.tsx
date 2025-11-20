import "@testing-library/jest-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import SnapsManagementLayout from "../";

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path=":snapId" element={<SnapsManagementLayout />}>
          <Route path="*" element={null} />
        </Route>
      </Routes>
    </BrowserRouter>,
  );
};

const snapName = "test-snap-name";
const buildNumber = 12345;

function mockLocation(url: string) {
  // mock location so that react-router-dom can build URLs correctly
  // @ts-expect-error window.location is supposed to be read-only
  window.location = new URL(url);
}

describe("SnapsManagementLayout -> Tab navigation", () => {
  beforeEach(() => {
    mockLocation(`http://localhost:8004/${snapName}/builds/${buildNumber}`);
  });

  test("the 'Listing' tab has the correct path", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs).getByRole("link", { name: "Listing" }).getAttribute("href"),
    ).toBe(`/${snapName}/listing`);
  });

  test("shows 'Listing' tab as selected", () => {
    mockLocation(`http://localhost:8004/${snapName}/listing`);

    renderComponent();
    expect(screen.getByRole("link", { name: "Listing" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("the 'Builds' tab has the correct path", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs).getByRole("link", { name: "Builds" }).getAttribute("href"),
    ).toBe(`/${snapName}/builds`);
  });

  test("shows 'Builds' tab as selected", () => {
    mockLocation(`http://localhost:8004/${snapName}/builds`);

    renderComponent();
    expect(screen.getByRole("link", { name: "Builds" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("shows 'Builds' tab as selected when inside a build", () => {
    mockLocation(`http://localhost:8004/${snapName}/builds/${buildNumber}`);

    renderComponent();

    const tabs = screen.getByRole("navigation");
    expect(within(tabs).getByRole("link", { name: "Builds" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("the 'Releases' tab has the correct path", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs).getByRole("link", { name: "Releases" }).getAttribute("href"),
    ).toBe(`/${snapName}/releases`);
  });

  test("shows 'Releases' tab as selected", () => {
    mockLocation(`http://localhost:8004/${snapName}/releases`);

    renderComponent();
    expect(screen.getByRole("link", { name: "Releases" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("the 'Metrics' tab has the correct path", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs).getByRole("link", { name: "Metrics" }).getAttribute("href"),
    ).toBe(`/${snapName}/metrics`);
  });

  test("shows 'Metrics' tab as selected", () => {
    mockLocation(`http://localhost:8004/${snapName}/metrics`);

    renderComponent();
    expect(screen.getByRole("link", { name: "Metrics" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("the 'Publicise' tab has the correct path", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs)
        .getByRole("link", { name: "Publicise" })
        .getAttribute("href"),
    ).toBe(`/${snapName}/publicise`);
  });

  test("shows 'Publicise' tab as selected", () => {
    mockLocation(`http://localhost:8004/${snapName}/publicise`);

    renderComponent();
    expect(screen.getByRole("link", { name: "Publicise" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("shows 'Publicise' tab as selected when inside badges", () => {
    mockLocation(`http://localhost:8004/${snapName}/publicise/badges`);

    renderComponent();
    expect(screen.getByRole("link", { name: "Publicise" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("shows 'Publicise' tab as selected when inside cards", () => {
    mockLocation(`http://localhost:8004/${snapName}/publicise/cards`);

    renderComponent();
    expect(screen.getByRole("link", { name: "Publicise" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("the 'Settings' tab has the correct path", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs).getByRole("link", { name: "Settings" }).getAttribute("href"),
    ).toBe(`/${snapName}/settings`);
  });

  test("shows 'Settings' tab as selected", () => {
    mockLocation(`http://localhost:8004/${snapName}/settings`);

    renderComponent();
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
