import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "react-query";
import { configureStore } from "@reduxjs/toolkit";
import "@testing-library/jest-dom";

import currentTrackReducer from "../../slices/currentTrack";
import { getPackageMetadata } from "../../helpers";
import ReleasesHeading from "../releasesHeading";

vi.mock("../releasesTable", () => ({ default: () => null }));
vi.mock("../defaultTrackModifier", () => ({ default: () => null }));
vi.mock("../../helpers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../helpers")>()),
  getPackageMetadata: vi.fn(),
}));

const mockedGetPackageMetadata = vi.mocked(getPackageMetadata);

function renderComponent() {
  const store = configureStore({
    reducer: {
      currentTrack: currentTrackReducer,
      defaultTrack: (state: string | null = "latest") => state,
      options: (state = { tracks: [{ name: "latest" }, { name: "2.x" }] }) =>
        state,
    },
    preloadedState: { currentTrack: "latest" },
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const utils = render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ReleasesHeading snapName="test-snap" />
      </QueryClientProvider>
    </Provider>,
  );

  return { ...utils, store };
}

function getAddTrackAside() {
  return document.getElementById("add-track-aside-panel") as HTMLElement;
}

function getRequestTrackAside() {
  return document.getElementById("request-track-aside-panel") as HTMLElement;
}

function getAddTrackButton() {
  return within(getAddTrackAside()).getByRole("button", {
    name: /Add track|Loading/,
  });
}

function getTrackNameInput() {
  return within(getAddTrackAside()).getByLabelText("Track name");
}

function getVersionPatternInput() {
  return within(getAddTrackAside()).getByLabelText("Version pattern");
}

function getPhasingPercentageInput() {
  return within(getAddTrackAside()).getByLabelText(
    "Automatic phasing percentage",
  );
}

async function openDropdown(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText("latest"));
}

describe("ReleasesHeading", () => {
  beforeEach(() => {
    mockedGetPackageMetadata.mockResolvedValue({
      tracks: [],
      "track-guardrails": [{ pattern: ".*" }],
    } as unknown as Awaited<ReturnType<typeof getPackageMetadata>>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mockedGetPackageMetadata.mockReset();
  });

  describe("track dropdown buttons", () => {
    it("shows an 'Add track' button when guardrails exist", async () => {
      const user = userEvent.setup();
      const { container } = renderComponent();

      await openDropdown(user);

      await waitFor(() =>
        expect(container.querySelector(".new-track-button")).toHaveTextContent(
          "Add track",
        ),
      );
      expect(screen.queryByText("Request track")).not.toBeInTheDocument();
    });

    it("shows a 'Request track' button when there are no guardrails", async () => {
      mockedGetPackageMetadata.mockResolvedValue({
        tracks: [],
        "track-guardrails": [],
      } as unknown as Awaited<ReturnType<typeof getPackageMetadata>>);
      const user = userEvent.setup();
      renderComponent();

      await openDropdown(user);

      expect(
        await screen.findByRole("button", { name: "Request track" }),
      ).toBeInTheDocument();
    });

    it("renders neither button when the snap has no guardrails data", async () => {
      mockedGetPackageMetadata.mockResolvedValue({
        tracks: [],
      } as unknown as Awaited<ReturnType<typeof getPackageMetadata>>);
      const user = userEvent.setup();
      const { container } = renderComponent();

      await openDropdown(user);

      await waitFor(() => expect(mockedGetPackageMetadata).toHaveBeenCalled());
      expect(container.querySelector(".new-track-button")).toBeNull();
    });

    it("opens the add track panel and closes the dropdown", async () => {
      const user = userEvent.setup();
      const { container } = renderComponent();

      expect(getAddTrackAside()).toHaveClass("is-collapsed");

      await openDropdown(user);
      await waitFor(() =>
        expect(container.querySelector(".new-track-button")).not.toBeNull(),
      );
      await user.click(
        container.querySelector(".new-track-button") as HTMLElement,
      );

      expect(getAddTrackAside()).not.toHaveClass("is-collapsed");
      expect(container.querySelector(".dropdown-menu")).toBeNull();
    });
  });

  describe("request track panel", () => {
    beforeEach(() => {
      mockedGetPackageMetadata.mockResolvedValue({
        tracks: [],
        "track-guardrails": [],
      } as unknown as Awaited<ReturnType<typeof getPackageMetadata>>);
    });

    async function openRequestPanel(user: ReturnType<typeof userEvent.setup>) {
      await openDropdown(user);
      await user.click(
        await screen.findByRole("button", { name: "Request track" }),
      );
    }

    it("opens when 'Request track' is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      expect(getRequestTrackAside()).toHaveClass("is-collapsed");
      await openRequestPanel(user);
      expect(getRequestTrackAside()).not.toHaveClass("is-collapsed");
    });

    it("closes when 'Cancel' is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      await openRequestPanel(user);
      await user.click(
        within(getRequestTrackAside()).getByRole("button", { name: "Cancel" }),
      );

      expect(getRequestTrackAside()).toHaveClass("is-collapsed");
    });

    it("opens the forum in a new tab when 'Request on Forum' is clicked", async () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const user = userEvent.setup();
      renderComponent();

      await openRequestPanel(user);
      await user.click(
        within(getRequestTrackAside()).getByRole("button", {
          name: "Request on Forum",
        }),
      );

      expect(open).toHaveBeenCalledWith(
        'https://forum.snapcraft.io/new-topic?title=Create+new+track+for+"snap+name"&category=store-requests',
        "_blank",
      );
    });
  });

  describe("add track form", () => {
    it("renders the track name, version pattern and phasing fields", () => {
      renderComponent();

      expect(getTrackNameInput()).toHaveAttribute(
        "placeholder",
        "display-name123",
      );
      expect(getVersionPatternInput()).toHaveAttribute("placeholder", "?.v.*");
      expect(getPhasingPercentageInput()).toHaveAttribute(
        "placeholder",
        "10.15",
      );
      expect(
        screen.getByText(
          "Name should follow the track creation guardrails (TCG).",
        ),
      ).toBeInTheDocument();
    });

    it("keeps the optional fields in a collapsed accordion until opened", async () => {
      const user = userEvent.setup();
      const { container } = renderComponent();
      const details = container.querySelector("details") as HTMLDetailsElement;

      expect(details.open).toBe(false);

      await user.click(screen.getByText("Optional Properties"));

      expect(details.open).toBe(true);
    });

    it("does not submit natively when Enter is pressed", async () => {
      const user = userEvent.setup();
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      renderComponent();

      await user.type(getTrackNameInput(), "1.x{Enter}");

      expect(fetchMock).not.toHaveBeenCalled();
    });

    describe("'Add track' button state", () => {
      it("is disabled until a track name is entered", async () => {
        const user = userEvent.setup();
        renderComponent();

        expect(getAddTrackButton()).toBeDisabled();

        await user.type(getTrackNameInput(), "1.x");
        expect(getAddTrackButton()).toBeEnabled();

        await user.clear(getTrackNameInput());
        expect(getAddTrackButton()).toBeDisabled();
      });

      it("stays disabled when the track name is only whitespace", async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.type(getTrackNameInput(), "   ");

        expect(getAddTrackButton()).toBeDisabled();
      });
    });

    describe("phasing percentage validation", () => {
      it.each([
        ["abc", "Phasing percentage must be a number"],
        ["101", "Phasing percentage must be between 0 and 100"],
        ["-1", "Phasing percentage must be between 0 and 100"],
      ])("shows an error for '%s'", async (value, message) => {
        const user = userEvent.setup();
        renderComponent();

        await user.type(getTrackNameInput(), "1.x");
        await user.type(getPhasingPercentageInput(), value);

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(getAddTrackButton()).toBeDisabled();
      });

      it("clears the error and re-enables the button when corrected", async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.type(getTrackNameInput(), "1.x");
        await user.type(getPhasingPercentageInput(), "abc");
        expect(
          await screen.findByText("Phasing percentage must be a number"),
        ).toBeInTheDocument();

        await user.clear(getPhasingPercentageInput());
        await user.type(getPhasingPercentageInput(), "50");

        await waitFor(() =>
          expect(
            screen.queryByText("Phasing percentage must be a number"),
          ).not.toBeInTheDocument(),
        );
        expect(getAddTrackButton()).toBeEnabled();
      });
    });

    describe("submitting", () => {
      it("sends only the track name when optional fields are empty", async () => {
        const user = userEvent.setup();
        const fetchMock = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({}),
        });
        vi.stubGlobal("fetch", fetchMock);
        renderComponent();

        await user.type(getTrackNameInput(), "1.x");
        await user.click(getAddTrackButton());

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe("/test-snap/create-track");
        expect(options.method).toBe("POST");
        expect(options.body.toString()).toBe("track-name=1.x");
      });

      it("includes the version pattern and phasing percentage when set", async () => {
        const user = userEvent.setup();
        const fetchMock = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({}),
        });
        vi.stubGlobal("fetch", fetchMock);
        renderComponent();

        await user.type(getTrackNameInput(), "1.x");
        await user.type(getVersionPatternInput(), "1.*");
        await user.type(getPhasingPercentageInput(), "25");
        await user.click(getAddTrackButton());

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        const params = new URLSearchParams(
          fetchMock.mock.calls[0][1].body.toString(),
        );
        expect(params.get("track-name")).toBe("1.x");
        expect(params.get("version-pattern")).toBe("1.*");
        expect(params.get("automatic-phasing-percentage")).toBe("25");
      });

      it("shows a loading state while the request is in flight", async () => {
        const user = userEvent.setup();
        let resolveFetch: (value: unknown) => void = () => {};
        vi.stubGlobal(
          "fetch",
          vi.fn().mockReturnValue(
            new Promise((resolve) => {
              resolveFetch = resolve;
            }),
          ),
        );
        renderComponent();

        await user.type(getTrackNameInput(), "1.x");
        await user.click(getAddTrackButton());

        const button = getAddTrackButton();
        expect(button).toHaveTextContent("Loading...");
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute("aria-busy", "true");

        resolveFetch({ ok: true, json: async () => ({}) });
        await waitFor(() =>
          expect(getAddTrackButton()).toHaveTextContent("Add track"),
        );
      });

      it("selects the new track, closes the panel and shows a success message", async () => {
        const user = userEvent.setup();
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
        );
        const { store } = renderComponent();

        await user.click(screen.getByText("latest"));
        await user.type(getTrackNameInput(), "1.x");
        await user.click(getAddTrackButton());

        expect(
          await screen.findByText("Track 1.x created successfully"),
        ).toBeInTheDocument();
        expect(store.getState().currentTrack).toBe("1.x");
        expect(getAddTrackAside()).toHaveClass("is-collapsed");
        expect(getTrackNameInput()).toHaveValue("");
      });

      it("shows the server error against the track name field", async () => {
        const user = userEvent.setup();
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: "Track name is invalid" }),
          }),
        );
        renderComponent();

        await user.type(getTrackNameInput(), "bad name");
        await user.click(getAddTrackButton());

        expect(await screen.findByRole("alert")).toHaveTextContent(
          "Track name is invalid",
        );
        expect(getTrackNameInput()).toHaveAttribute("aria-invalid", "true");
        expect(getTrackNameInput()).toHaveValue("bad name");
      });

      it("prefers the first message from the error list", async () => {
        const user = userEvent.setup();
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({
              error: "Generic error",
              "error-list": [{ message: "Does not match guardrails" }],
            }),
          }),
        );
        renderComponent();

        await user.type(getTrackNameInput(), "bad");
        await user.click(getAddTrackButton());

        expect(await screen.findByRole("alert")).toHaveTextContent(
          "Does not match guardrails",
        );
      });

      it("clears the server error when the track name changes", async () => {
        const user = userEvent.setup();
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: "Track name is invalid" }),
          }),
        );
        renderComponent();

        await user.type(getTrackNameInput(), "bad");
        await user.click(getAddTrackButton());
        await screen.findByRole("alert");

        await user.type(getTrackNameInput(), "x");

        await waitFor(() =>
          expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
        );
      });

      it("shows an error notification when the request fails", async () => {
        const user = userEvent.setup();
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
        renderComponent();

        await user.type(getTrackNameInput(), "1.x");
        await user.click(getAddTrackButton());

        expect(await screen.findByText("Network")).toBeInTheDocument();
        expect(getAddTrackButton()).toBeEnabled();
      });
    });

    describe("cancelling", () => {
      it("resets the fields and errors and closes the panel", async () => {
        const user = userEvent.setup();
        const { container } = renderComponent();

        await openDropdown(user);
        await waitFor(() =>
          expect(container.querySelector(".new-track-button")).not.toBeNull(),
        );
        await user.click(
          container.querySelector(".new-track-button") as HTMLElement,
        );

        await user.type(getTrackNameInput(), "1.x");
        await user.type(getVersionPatternInput(), "1.*");
        await user.type(getPhasingPercentageInput(), "abc");
        expect(
          await screen.findByText("Phasing percentage must be a number"),
        ).toBeInTheDocument();

        await user.click(
          within(getAddTrackAside()).getByRole("button", { name: "Cancel" }),
        );

        expect(getAddTrackAside()).toHaveClass("is-collapsed");
        expect(getTrackNameInput()).toHaveValue("");
        expect(getVersionPatternInput()).toHaveValue("");
        expect(getPhasingPercentageInput()).toHaveValue("");
        await waitFor(() =>
          expect(
            screen.queryByText("Phasing percentage must be a number"),
          ).not.toBeInTheDocument(),
        );
        expect(getAddTrackButton()).toBeDisabled();
      });
    });
  });
});
