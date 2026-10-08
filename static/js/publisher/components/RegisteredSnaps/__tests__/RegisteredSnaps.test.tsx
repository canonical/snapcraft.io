import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Mock } from "vitest";

import { ISnap } from "../../../types";
import RegisteredSnaps from "../RegisteredSnaps";
import "@testing-library/jest-dom";

const BASE_SNAP_DATA = {
  snapName: "test-snap-1",
  icon_url: null,
  latest_comments: [],
  latest_release: {
    architectures: ["arm64"],
    channels: ["edge"],
    revision: 3,
    since: "2024-10-09T09:33:14Z",
    status: "Published",
    version: "4.0.1",
  },
  latest_revisions: [
    {
      architectures: ["arm64"],
      channels: ["edge"],
      revision: 3,
      since: "2024-10-09T09:33:14Z",
      status: "Published",
      version: "4.0.1",
    },
  ],
  price: null,
  private: true,
  publisher: {
    "display-name": "Test User 2",
    id: "prFvYmvaBsQbXLNaVaQFV4EAcJ8zh0Ej",
    username: "test-user-2",
    validation: null,
  },
  since: "2021-01-07T14:48:48Z",
  "snap-id": "2WF9gVKsi8iDCB4WFF5uO8JyBOImG2fb",
  status: "Approved",
  store: "Global",
  unlisted: false,
};

const queryClient = new QueryClient();

const renderComponent = (
  snaps: ISnap[],
  refetchSnaps: () => void = vi.fn(),
) => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <RegisteredSnaps
          currentUser="test-user"
          snaps={snaps}
          refetchSnaps={refetchSnaps}
        />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

const OWN_SNAP_DATA = {
  ...BASE_SNAP_DATA,
  publisher: {
    ...BASE_SNAP_DATA.publisher,
    username: "test-user",
  },
};

const generateSnaps = () => {
  const snaps: ISnap[] = [];
  for (let i = 0; i < 15; i++) {
    const snap = {
      ...BASE_SNAP_DATA,
      snapName: `Test Snap ${i}`,
    };

    snaps.push(snap);
  }
  return snaps;
};

describe("RegisteredSnaps", () => {
  test("should show correct number of snaps in a page", () => {
    const snaps: ISnap[] = generateSnaps();

    renderComponent(snaps);
    expect(screen.getAllByRole("row").length).toBe(10);
  });

  test("should paginate correctly", () => {
    const snaps: ISnap[] = generateSnaps();

    renderComponent(snaps);

    const paginationButtons = screen.getAllByRole("button");
    fireEvent.click(paginationButtons[paginationButtons.length - 1]);
    expect(screen.getAllByRole("row").length).toBe(5);
  });

  test("should show dispute pending label", () => {
    renderComponent([
      {
        ...BASE_SNAP_DATA,
        status: "DisputePending",
      },
    ]);

    expect(screen.getByText("(Name dispute in progress)")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Name dispute in progress"),
    ).toBeInTheDocument();
  });

  test("should show review pending label", () => {
    renderComponent([
      {
        ...BASE_SNAP_DATA,
        status: "ReviewPending",
      },
    ]);
    expect(screen.getByText("(Review pending)")).toBeInTheDocument();
    expect(screen.getByLabelText("Review pending")).toBeInTheDocument();
  });

  test("should show link to publish docs", () => {
    renderComponent([
      {
        ...BASE_SNAP_DATA,
        status: "Approved",
      },
    ]);
    expect(
      screen.getByRole("link", { name: "Publish to this name" }),
    ).toBeInTheDocument();
  });

  test("should show the snap name correctly", () => {
    renderComponent([
      {
        ...BASE_SNAP_DATA,
        snapName: "test-snap",
      },
    ]);
    expect(screen.queryByLabelText("Name dispute in progress")).toBeNull();
    expect(screen.getByText("test-snap")).not.toBeNull();
  });

  test("should render the unregister button disabled if the snap doesn't belong to the current user", () => {
    renderComponent([BASE_SNAP_DATA]);

    expect(screen.getByRole("button", { name: "Unregister" })).toBeDisabled();
  });

  test("should call the refresh function when a snap name is unregistered", () => {
    renderComponent([OWN_SNAP_DATA]);

    const unregisterButton = screen.getByRole("button", { name: "Unregister" });
    expect(unregisterButton).not.toBeDisabled();
  });

  test("should call refetchSnaps and not show an error when unregistering succeeds", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
      }),
    ) as Mock;
    vi.stubGlobal("fetch", fetchMock);
    const refetchSnaps = vi.fn();

    renderComponent([OWN_SNAP_DATA], refetchSnaps);

    fireEvent.click(screen.getByRole("button", { name: "Unregister" }));
    const confirmButton = screen.getByRole("button", {
      name: "Unregister snap",
    });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(refetchSnaps).toHaveBeenCalled());
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  test("should show the API error message when unregistering fails", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({ error: "Snap could not be unregistered" }),
      }),
    ) as Mock;
    vi.stubGlobal("fetch", fetchMock);

    renderComponent([OWN_SNAP_DATA]);

    fireEvent.click(screen.getByRole("button", { name: "Unregister" }));
    const confirmButton = screen.getByRole("button", {
      name: "Unregister snap",
    });
    fireEvent.click(confirmButton);

    expect(
      await screen.findByText("Snap could not be unregistered"),
    ).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  test("should navigate to SSO authorization without refetching snaps", async () => {
    const location = { href: "" };
    vi.stubGlobal("location", location);
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          status: 202,
          ok: true,
          json: () =>
            Promise.resolve({
              authorization_required: true,
              redirect_url: "/login/unregister-snap/test-action",
            }),
        }),
      ),
    );
    const refetchSnaps = vi.fn();
    renderComponent([OWN_SNAP_DATA], refetchSnaps);
    fireEvent.click(screen.getByRole("button", { name: "Unregister" }));
    fireEvent.click(screen.getByRole("button", { name: "Unregister snap" }));

    await waitFor(() => {
      expect(location.href).toBe("/login/unregister-snap/test-action");
    });
    expect(refetchSnaps).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  test("should show an error for an incomplete authorization response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          status: 202,
          ok: true,
          json: () => Promise.resolve({ authorization_required: true }),
        }),
      ),
    );
    const refetchSnaps = vi.fn();
    renderComponent([OWN_SNAP_DATA], refetchSnaps);
    fireEvent.click(screen.getByRole("button", { name: "Unregister" }));
    fireEvent.click(screen.getByRole("button", { name: "Unregister snap" }));

    expect(
      await screen.findByText("Something went wrong. Please try again later."),
    ).toBeInTheDocument();
    expect(refetchSnaps).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  test("should show the default error message when the API response has no error message", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      }),
    ) as Mock;
    vi.stubGlobal("fetch", fetchMock);

    renderComponent([OWN_SNAP_DATA]);

    fireEvent.click(screen.getByRole("button", { name: "Unregister" }));
    const confirmButton = screen.getByRole("button", {
      name: "Unregister snap",
    });
    fireEvent.click(confirmButton);

    expect(
      await screen.findByText("Something went wrong. Please try again later."),
    ).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  test("should show the default error message when the fetch call throws", async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error("Network error")));
    vi.stubGlobal("fetch", fetchMock);

    renderComponent([OWN_SNAP_DATA]);

    fireEvent.click(screen.getByRole("button", { name: "Unregister" }));
    const confirmButton = screen.getByRole("button", {
      name: "Unregister snap",
    });
    fireEvent.click(confirmButton);

    expect(
      await screen.findByText("Something went wrong. Please try again later."),
    ).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
