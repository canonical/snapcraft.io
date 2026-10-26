import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

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

describe("AccountSnaps", () => {
  beforeEach(() => {
    window.PUBLISHER_FLASH_MESSAGES = [];
  });

  afterEach(() => {
    delete window.PUBLISHER_FLASH_MESSAGES;
    vi.useRealTimers();
  });

  test("shows unregister success inside the page heading container", () => {
    // @ts-expect-error Mocking useQuery with status loading
    useQuery.mockReturnValue({ status: "loading", data: undefined });
    window.PUBLISHER_FLASH_MESSAGES = [
      ["positive", "test-snap has been unregistered."],
    ];
    renderComponent();

    const heading = screen.getByRole("heading", {
      name: "My snaps / Overview",
    });
    const notification = screen.getByText("test-snap has been unregistered.");
    expect(heading.parentElement).toContainElement(notification);
    expect(window.PUBLISHER_FLASH_MESSAGES).toEqual([]);
  });

  test("dismisses success after ten seconds but preserves errors", () => {
    vi.useFakeTimers();
    // @ts-expect-error Mocking useQuery with status loading
    useQuery.mockReturnValue({ status: "loading", data: undefined });
    window.PUBLISHER_FLASH_MESSAGES = [
      ["positive", "test-snap has been unregistered."],
      ["negative", "Cannot unregister this snap"],
    ];
    renderComponent();
    act(() => {
      vi.advanceTimersByTime(9999);
    });
    expect(
      screen.getByText("test-snap has been unregistered."),
    ).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(
      screen.queryByText("test-snap has been unregistered."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Cannot unregister this snap")).toBeInTheDocument();
  });

  test("cleans up the notification timeout on unmount", () => {
    vi.useFakeTimers();
    // @ts-expect-error Mocking useQuery with status loading
    useQuery.mockReturnValue({ status: "loading", data: undefined });
    window.PUBLISHER_FLASH_MESSAGES = [
      ["positive", "test-snap has been unregistered."],
    ];
    const { unmount } = renderComponent();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

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
});
