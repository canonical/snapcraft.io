import "@testing-library/jest-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
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

describe("SnapsManagementLayout -> Breadcrumbs", () => {
  test("the page displays the correct name for the snap", () => {
    mockLocation(`http://localhost:8004/${snapName}/builds/${buildNumber}`);
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      snapName,
    );
  });

  test("the page displays the correct breadcrumb 'Listing'", () => {
    mockLocation(`http://localhost:8004/${snapName}/listing`);
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `My snaps / ${snapName} / Listing`,
    );
  });

  test("the page displays the correct breadcrumb 'Builds'", () => {
    mockLocation(`http://localhost:8004/${snapName}/builds`);
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `My snaps / ${snapName} / Builds`,
    );
  });

  test("the page displays the correct breadcrumb 'Builds' when inside a build", () => {
    mockLocation(`http://localhost:8004/${snapName}/builds/${buildNumber}`);
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `My snaps / ${snapName} / Builds / Build #${buildNumber}`,
    );
  });

  test("the page displays the correct breadcrumb 'Releases'", () => {
    mockLocation(`http://localhost:8004/${snapName}/releases`);
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `My snaps / ${snapName} / Releases`,
    );
  });

  test("the page displays the correct breadcrumb 'Metrics'", () => {
    mockLocation(`http://localhost:8004/${snapName}/metrics`);
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `My snaps / ${snapName} / Metrics`,
    );
  });

  test("the page displays the correct breadcrumb 'Publicise'", () => {
    mockLocation(`http://localhost:8004/${snapName}/publicise`);
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `My snaps / ${snapName} / Publicise`,
    );
  });

  test("the page displays the correct breadcrumb 'Publicise' when inside badges", () => {
    mockLocation(`http://localhost:8004/${snapName}/publicise/badges`);
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `My snaps / ${snapName} / Publicise`,
    );
  });

  test("the page displays the correct breadcrumb 'Publicise' when inside cards", () => {
    mockLocation(`http://localhost:8004/${snapName}/publicise/cards`);
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `My snaps / ${snapName} / Publicise`,
    );
  });

  test("the page displays the correct breadcrumb 'Settings'", () => {
    mockLocation(`http://localhost:8004/${snapName}/settings`);
    renderComponent();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `My snaps / ${snapName} / Settings`,
    );
  });
});
