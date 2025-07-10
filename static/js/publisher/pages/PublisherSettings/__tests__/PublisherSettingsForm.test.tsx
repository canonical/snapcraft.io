import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import PublisherSettingsForm from "../PublisherSettingsForm";

const queryClient = new QueryClient();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    snapId: "test-snap-id",
  }),
}));

const mockSettings = {
  blacklist_countries: [],
  countries: [{ key: "GB", name: "United Kingdom" }],
  private: false,
  snap_id: "test-snap-id",
  snap_name: "test-snap",
  span_title: "test-snap",
  status: "published",
  store: "Global",
  unlisted: false,
  update_metadata_on_release: true,
  visibility_locked: false,
  whitelist_countries: ["GB"],
};

const updateMetadataOnReleaseNotification =
  "This snap is set to have its metadata updated when a new revision is published in the stable channel. Any changes you make here will be overwritten by the contents of any snap published. If this is not desirable, please disable “Update metadata on release” for this snap.";

function renderComponent() {
  render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <PublisherSettingsForm settings={mockSettings} />
      </QueryClientProvider>
    </BrowserRouter>,
  );
}

describe("PublisherSettingsForm", () => {
  test("'Revert' and 'Save' buttons disabled by default", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Revert" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("sets visibility", () => {
    renderComponent();
    expect(screen.getByLabelText(/Public/)).toBeChecked();
  });

  test("sets selected territories", () => {
    renderComponent();
    expect(screen.getByLabelText("Selected territories")).toBeChecked();
  });

  test("sets 'Update metadata on release'", () => {
    renderComponent();
    expect(screen.getByLabelText("Update metadata on release:")).toBeChecked();
  });

  test("links to collaborators in dashboard", () => {
    renderComponent();
    expect(
      screen.getByRole("link", {
        name: "Manage collaborators in dashboard.snapcraft.io",
      }),
    ).toBeInTheDocument();
  });

  test("sets store", () => {
    renderComponent();
    expect(screen.getByLabelText("Store:")).toHaveTextContent("Global");
  });

  test("sets status", () => {
    renderComponent();
    expect(screen.getByLabelText("Status:")).toHaveTextContent("Published");
  });

  test("changing field enables buttons", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByLabelText("Update metadata on release:"));
    expect(screen.getByRole("button", { name: "Revert" })).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(screen.getByRole("button", { name: "Save" })).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  test("'Update metadata on release' shows warning if selected", () => {
    renderComponent();
    expect(
      screen.getByText(updateMetadataOnReleaseNotification),
    ).toBeInTheDocument();
  });

  test("'Update metadata on release' warning not shown if not selected", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByLabelText("Update metadata on release:"));
    expect(
      screen.queryByText(updateMetadataOnReleaseNotification),
    ).not.toBeInTheDocument();
  });
});
