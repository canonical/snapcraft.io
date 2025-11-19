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

describe("SnapsManagementLayout", () => {
  beforeEach(() => {
    // mock location so that react-router-dom can build URLs correctly
    // @ts-expect-error window.location is supposed to be read-only
    window.location = {
      hash: "",
      host: "localhost:8004",
      hostname: "localhost",
      href: `http://localhost:8004/${snapName}/builds/${buildNumber}`,
      origin: "http://localhost:8004",
      pathname: `/${snapName}/builds/${buildNumber}`,
      port: "8004",
      protocol: "http:",
    };
  });

  test("the page displays the correct name for the snap", () => {
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      snapName,
    );
  });

  test("the page displays the correct breadcrumb", () => {
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `My snaps / ${snapName} / Builds / Build #${buildNumber}`,
    );
  });

  test("the 'Listing' tab has the correct path", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs).getByRole("link", { name: "Listing" }).getAttribute("href"),
    ).toBe(`/${snapName}/listing`);
  });

  test("the 'Builds' tab has the correct path", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs).getByRole("link", { name: "Builds" }).getAttribute("href"),
    ).toBe(`/${snapName}/builds`);
  });

  test("the 'Releases' tab has the correct path", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs).getByRole("link", { name: "Releases" }).getAttribute("href"),
    ).toBe(`/${snapName}/releases`);
  });

  test("the 'Metrics' tab has the correct path", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs).getByRole("link", { name: "Metrics" }).getAttribute("href"),
    ).toBe(`/${snapName}/metrics`);
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

  test("the 'Settings' tab has the correct path", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs).getByRole("link", { name: "Settings" }).getAttribute("href"),
    ).toBe(`/${snapName}/settings`);
  });
});
