import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import PublisherSettingsForm from "../PublisherSettingsForm";

const queryClient = new QueryClient();

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
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
const updateMetadataModalText =
  "Making these changes means that the snap will no longer use the data from snapcraft.yaml.";

function renderComponent(settings = {}) {
  render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <PublisherSettingsForm settings={{ ...mockSettings, ...settings }} />
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

  test("reverting visibility restores the original option", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText(/Unlisted/));

    expect(screen.getByLabelText(/Unlisted/)).toBeChecked();
    expect(screen.getByLabelText(/Public/)).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Revert" }));

    expect(screen.getByLabelText(/Public/)).toBeChecked();
    expect(screen.getByLabelText(/Unlisted/)).not.toBeChecked();
  });

  test("saved visibility remains selected after save completes", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/snap_info/user_snap/test-snap") {
        return Promise.resolve(
          new Response(JSON.stringify({ is_users_snap: true }), {
            status: 200,
          }),
        );
      }

      if (url === "/api/test-snap/settings") {
        return Promise.resolve(
          new Response(JSON.stringify({ private: false, unlisted: true }), {
            status: 200,
          }),
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const scrollToMock = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);

    vi.stubGlobal("fetch", fetchMock);
    renderComponent({ update_metadata_on_release: false });

    await user.click(screen.getByLabelText(/Unlisted/));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/test-snap/settings",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(screen.getByLabelText(/Unlisted/)).toBeChecked();
    expect(screen.getByLabelText(/Public/)).not.toBeChecked();

    scrollToMock.mockRestore();
    vi.unstubAllGlobals();
  });

  test("saved distribution remains selected after save completes", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/snap_info/user_snap/test-snap") {
        return Promise.resolve(
          new Response(JSON.stringify({ is_users_snap: true }), {
            status: 200,
          }),
        );
      }

      if (url === "/api/test-snap/settings") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              blacklist_countries: [],
              whitelist_countries: [],
            }),
            { status: 200 },
          ),
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const scrollToMock = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);

    vi.stubGlobal("fetch", fetchMock);
    renderComponent();

    await user.click(screen.getByLabelText("All territories"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/test-snap/settings",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(screen.getByLabelText("All territories")).toBeChecked();
    expect(screen.getByLabelText("Selected territories")).not.toBeChecked();

    scrollToMock.mockRestore();
    vi.unstubAllGlobals();
  });

  test("saves visibility-only changes without showing update metadata modal", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/snap_info/user_snap/test-snap") {
        return Promise.resolve(
          new Response(JSON.stringify({ is_users_snap: true }), {
            status: 200,
          }),
        );
      }

      if (url === "/api/test-snap/settings") {
        return Promise.resolve(
          new Response(JSON.stringify({ private: false, unlisted: true }), {
            status: 200,
          }),
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const scrollToMock = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);

    vi.stubGlobal("fetch", fetchMock);
    renderComponent();

    await user.click(screen.getByLabelText(/Unlisted/));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.queryByText(updateMetadataModalText)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/test-snap/settings",
        expect.objectContaining({ method: "POST" }),
      );
    });

    scrollToMock.mockRestore();
    vi.unstubAllGlobals();
  });

  test("shows update metadata modal when disabling metadata updates", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/snap_info/user_snap/test-snap") {
        return Promise.resolve(
          new Response(JSON.stringify({ is_users_snap: true }), {
            status: 200,
          }),
        );
      }

      if (url === "/api/test-snap/settings") {
        return Promise.resolve(
          new Response(JSON.stringify({ update_metadata_on_release: false }), {
            status: 200,
          }),
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });
    const scrollToMock = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);

    vi.stubGlobal("fetch", fetchMock);
    renderComponent();

    await user.click(screen.getByLabelText("Update metadata on release:"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText(updateMetadataModalText)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/test-snap/settings",
      expect.objectContaining({ method: "POST" }),
    );

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/test-snap/settings",
        expect.objectContaining({ method: "POST" }),
      );
    });

    scrollToMock.mockRestore();
    vi.unstubAllGlobals();
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
