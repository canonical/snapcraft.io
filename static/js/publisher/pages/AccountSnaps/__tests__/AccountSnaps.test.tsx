import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import type { Mock } from "vitest";

import AccountSnaps from "../AccountSnaps";

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AccountSnaps />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

vi.mock("react-query", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: vi.fn(),
}));

const REGISTERED_SNAP = {
  snapName: "test-snap",
  icon_url: null,
  latest_comments: [],
  latest_release: null,
  latest_revisions: [],
  price: null,
  private: true,
  publisher: {
    "display-name": "Test User",
    id: "test-id",
    username: "test-user",
    validation: null,
  },
  since: "2021-01-07T14:48:48Z",
  "snap-id": "test-snap-id",
  status: "Approved",
  store: "Global",
  unlisted: false,
};

describe("AccountSnaps", () => {
  test("shows loading state when fetching validation set", () => {
    // @ts-expect-error Mocking useQuery with status loading
    useQuery.mockReturnValue({ status: "loading", data: undefined });

    renderComponent();
    expect(screen.getByText(/Fetching snaps/)).toBeInTheDocument();
  });

  test("shows message if no validation set", () => {
    // @ts-expect-error Mocking useQuery to return an empty array for no validation sets
    useQuery.mockReturnValue({
      status: "success",
      data: {
        snaps: [],
        registeredSnaps: [],
      },
    });

    renderComponent();
    expect(screen.getByText(/Get started…/)).toBeInTheDocument();
  });

  test("shows message when there is an error fetching validation set", () => {
    // @ts-expect-error Mocking useQuery with an error status to simulate a failed request
    useQuery.mockReturnValue({ status: "error", data: undefined });
    renderComponent();
    expect(
      screen.getByText(/Something went wrong. Please try again later./),
    ).toBeInTheDocument();
  });

  test("shows and auto-dismisses a success notification after unregistering a snap", async () => {
    // @ts-expect-error Mocking useQuery to return a registered snap
    useQuery.mockReturnValue({
      status: "success",
      data: {
        snaps: [],
        registeredSnaps: [REGISTERED_SNAP],
        currentUser: "test-user",
      },
      refetch: vi.fn(),
      isRefetching: false,
    });

    const fetchMock = vi.fn(() => Promise.resolve({ ok: true })) as Mock;
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers({ shouldAdvanceTime: true });

    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: "Unregister" }));
    fireEvent.click(screen.getByRole("button", { name: "Unregister snap" }));

    await waitFor(() =>
      expect(
        screen.getByText('"test-snap" has been unregistered.'),
      ).toBeInTheDocument(),
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(
      screen.queryByText('"test-snap" has been unregistered.'),
    ).not.toBeInTheDocument();

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("a second unregister within 5s does not clear the newer notification early", async () => {
    // @ts-expect-error Mocking useQuery to return registered snaps
    useQuery.mockReturnValue({
      status: "success",
      data: {
        snaps: [],
        registeredSnaps: [
          REGISTERED_SNAP,
          { ...REGISTERED_SNAP, snapName: "other-snap" },
        ],
        currentUser: "test-user",
      },
      refetch: vi.fn(),
      isRefetching: false,
    });

    const fetchMock = vi.fn(() => Promise.resolve({ ok: true })) as Mock;
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers({ shouldAdvanceTime: true });

    renderComponent();

    const unregisterButtons = screen.getAllByRole("button", {
      name: "Unregister",
    });

    fireEvent.click(unregisterButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: "Unregister snap" }));
    await waitFor(() =>
      expect(
        screen.getByText('"test-snap" has been unregistered.'),
      ).toBeInTheDocument(),
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    fireEvent.click(unregisterButtons[1]);
    fireEvent.click(screen.getByRole("button", { name: "Unregister snap" }));
    await waitFor(() =>
      expect(
        screen.getByText('"other-snap" has been unregistered.'),
      ).toBeInTheDocument(),
    );

    // The first timer would have fired here (3000ms + 2000ms = 5000ms since
    // it started); it must not clear the second snap's notification.
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(
      screen.getByText('"other-snap" has been unregistered.'),
    ).toBeInTheDocument();

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});
