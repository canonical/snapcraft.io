import "@testing-library/jest-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import SnapsManagementLayout from "../";

const releaseStatusMock = vi.fn();

vi.mock("../../../hooks/useSnapReleaseStatus", () => ({
  default: (snapName: string | undefined) => releaseStatusMock(snapName),
}));

const queryClient = new QueryClient();
const snapName = "test-snap-name";

const renderComponent = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path=":snapId" element={<SnapsManagementLayout />}>
            <Route path="*" element={<div data-testid="page-content" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>,
  );

function mockLocation(url: string) {
  // @ts-expect-error window.location is supposed to be read-only
  window.location = new URL(url);
}

describe("SnapsManagementLayout when the snap has no releases", () => {
  beforeEach(() => {
    mockLocation(`http://localhost:8004/${snapName}/listing`);
    releaseStatusMock.mockReturnValue({
      data: { has_releases: false },
      isLoading: false,
    });
  });

  test("shows the no-revision warning banner", () => {
    renderComponent();
    expect(
      screen.getByText(/doesn’t have a first build yet/i),
    ).toBeInTheDocument();
  });

  test("warning links to the releasing-your-app guide", () => {
    renderComponent();
    const link = screen.getByRole("link", { name: /releasing your app/i });
    expect(link).toHaveAttribute("href", "/docs/releasing-your-app");
  });

  test("hides the outlet content", () => {
    renderComponent();
    expect(screen.queryByTestId("page-content")).not.toBeInTheDocument();
  });

  test("renders tabs in disabled state", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    const listing = within(tabs).getByText("Listing");
    expect(listing.closest("[aria-disabled]")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    // No active link should be present when disabled.
    expect(within(tabs).queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("SnapsManagementLayout when the snap has releases", () => {
  beforeEach(() => {
    mockLocation(`http://localhost:8004/${snapName}/listing`);
    releaseStatusMock.mockReturnValue({
      data: { has_releases: true },
      isLoading: false,
    });
  });

  test("renders the outlet content", () => {
    renderComponent();
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
  });

  test("does not render the warning banner", () => {
    renderComponent();
    expect(
      screen.queryByText(/doesn’t have a first build yet/i),
    ).not.toBeInTheDocument();
  });

  test("tabs are clickable links", () => {
    renderComponent();
    const tabs = screen.getByRole("navigation");
    expect(
      within(tabs).getByRole("link", { name: "Listing" }),
    ).toHaveAttribute("href", `/${snapName}/listing`);
  });
});

describe("SnapsManagementLayout while release status is loading", () => {
  beforeEach(() => {
    mockLocation(`http://localhost:8004/${snapName}/listing`);
    releaseStatusMock.mockReturnValue({ data: undefined, isLoading: true });
  });

  test("does not block the page while loading", () => {
    renderComponent();
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    expect(
      screen.queryByText(/doesn’t have a first build yet/i),
    ).not.toBeInTheDocument();
  });
});
