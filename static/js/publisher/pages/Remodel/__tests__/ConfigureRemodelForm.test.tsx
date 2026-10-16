import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { createStore, Provider } from "jotai";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import ConfigureRemodelForm from "../ConfigureRemodelForm";
import { brandIdState } from "../../../state/brandStoreState";
import { remodelsListState } from "../../../state/remodelsState";
import type { Remodel } from "../../../types/shared";

const { useModels } = vi.hoisted(() => ({ useModels: vi.fn() }));

vi.mock("../../../hooks", () => ({ useModels }));

const remodelPath = "/admin/test-store/models/current-model/remodel";
const conflictMessage =
  "There is an existing remodel with this configuration. Choose another target model or a different device to target.";

function CurrentLocation() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

const renderComponent = (remodels: Remodel[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const store = createStore();
  store.set(brandIdState, "test-brand");
  store.set(remodelsListState, remodels);
  const props = {
    setShowErrorNotification: vi.fn(),
    setErrorMessage: vi.fn(),
    setShowNotification: vi.fn(),
    setNotificationMessage: vi.fn(),
    refetch: vi.fn(),
  };

  render(
    <MemoryRouter initialEntries={[`${remodelPath}/configure`]}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route
              path="/admin/:id/models/:modelId/remodel/*"
              element={<ConfigureRemodelForm {...props} />}
            />
          </Routes>
          <CurrentLocation />
        </QueryClientProvider>
      </Provider>
    </MemoryRouter>,
  );

  return { ...props, store, user: userEvent.setup() };
};

const selectTargetModel = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Select a target model" }),
    "test-model-1",
  );
};

const existingRemodel = (serial: string | null): Remodel => ({
  "created-at": "2026-01-01T00:00:00Z",
  "created-by": "test-user",
  "from-model": "current-model",
  "from-serial": serial,
  "modified-at": null,
  "modified-by": null,
  "to-model": "test-model-1",
});

describe("ConfigureRemodelForm", () => {
  beforeEach(() => {
    useModels.mockReturnValue({
      data: [
        { name: "current-model" },
        { name: "test-model-1" },
        { name: "undefined" },
      ],
      isLoading: false,
      error: null,
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true })),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("disables Confirm and selects Enter serial by default", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Enter serial" })).toBeChecked();
    expect(
      screen.getByRole("textbox", { name: "Serial number" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Configure a remodel - Snapcraft");
  });

  it("excludes the current model and undefined models from the options", () => {
    renderComponent();
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Select a model", "test-model-1"]);
  });

  it("disables the model select when all models are filtered out", () => {
    useModels.mockReturnValue({
      data: [{ name: "current-model" }, { name: "undefined" }],
      isLoading: false,
      error: null,
    });
    renderComponent();
    expect(
      screen.getByRole("combobox", { name: "Select a target model" }),
    ).toBeDisabled();
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it.each([undefined, []])(
    "disables the model select when models are unavailable: %s",
    (data) => {
      useModels.mockReturnValue({ data, isLoading: false, error: null });
      renderComponent();
      expect(
        screen.getByRole("combobox", { name: "Select a target model" }),
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    },
  );

  it.each([
    { isLoading: true, error: null },
    { isLoading: false, error: new Error("Unable to load models") },
  ])("does not offer target models during loading or errors: %s", (state) => {
    useModels.mockReturnValue({
      data: [{ name: "test-model-1" }],
      ...state,
    });
    renderComponent();
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("updates the model select when models finish loading", async () => {
    useModels.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    const { store, user } = renderComponent();
    expect(screen.getByRole("combobox")).toBeDisabled();
    useModels.mockReturnValue({
      data: [{ name: "test-model-1" }],
      isLoading: false,
      error: null,
    });
    act(() => store.set(remodelsListState, []));
    expect(screen.getByRole("combobox")).toBeEnabled();
    await selectTargetModel(user);
    await user.click(screen.getByRole("radio", { name: "All serials" }));
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();

    useModels.mockReturnValue({
      data: [{ name: "test-model-1" }, { name: "test-model-2" }],
      isLoading: false,
      error: null,
    });
    act(() => store.set(remodelsListState, []));
    expect(
      screen.getByRole("option", { name: "test-model-2" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("test-model-1");
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
  });

  it("enables Confirm only when both target model and serial are entered", async () => {
    const { user } = renderComponent();
    const confirm = screen.getByRole("button", { name: "Confirm" });
    await user.type(
      screen.getByRole("textbox", { name: "Serial number" }),
      "test-serial",
    );
    expect(confirm).toBeDisabled();
    await selectTargetModel(user);
    expect(confirm).toBeEnabled();
    await user.clear(screen.getByRole("textbox", { name: "Serial number" }));
    expect(confirm).toBeDisabled();
  });

  it("requires a model even when All serials is selected", async () => {
    const { user } = renderComponent();
    await user.click(screen.getByRole("radio", { name: "All serials" }));
    expect(
      screen.queryByRole("textbox", { name: "Serial number" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    await selectTargetModel(user);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
  });

  it("clears the serial when switching to All serials and back", async () => {
    const { user } = renderComponent();
    await selectTargetModel(user);
    await user.type(
      screen.getByRole("textbox", { name: "Serial number" }),
      "test-serial",
    );
    await user.click(screen.getByRole("radio", { name: "All serials" }));
    await user.click(screen.getByRole("radio", { name: "Enter serial" }));
    expect(screen.getByRole("textbox", { name: "Serial number" })).toHaveValue(
      "",
    );
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it.each([
    { allSerials: false, description: "A remodel note" },
    { allSerials: true, description: "" },
  ])(
    "submits the unchanged payload: %s",
    async ({ allSerials, description }) => {
      const { user, refetch, setNotificationMessage, setShowNotification } =
        renderComponent();
      await selectTargetModel(user);
      await user.type(
        screen.getByRole("textbox", { name: "Serial number" }),
        "test-serial",
      );
      if (allSerials) {
        await user.click(screen.getByRole("radio", { name: "All serials" }));
      }
      if (description) {
        await user.type(
          screen.getByRole("textbox", { name: "Note (Max 140 characters)" }),
          description,
        );
      }
      await user.click(screen.getByRole("button", { name: "Confirm" }));
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/store/test-brand/models/remodel-allowlist",
          {
            method: "POST",
            body: JSON.stringify([
              {
                "from-model": "current-model",
                "to-model": "test-model-1",
                "from-serial": allSerials ? null : "test-serial",
                description,
              },
            ]),
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": window.CSRF_TOKEN,
            },
          },
        );
        expect(setNotificationMessage).toHaveBeenCalledWith(
          "New remodel configured",
        );
        expect(setShowNotification).toHaveBeenCalledWith(true);
        expect(refetch).toHaveBeenCalledOnce();
        expect(screen.getByTestId("location").textContent).toBe(remodelPath);
      });
    },
  );

  it("keeps the note optional and limits it to 140 characters", async () => {
    const { user } = renderComponent();
    const note = screen.getByRole("textbox", {
      name: "Note (Max 140 characters)",
    });
    expect(note).not.toBeRequired();
    expect(note).toHaveAttribute("maxLength", "140");
    await user.type(note, "a".repeat(141));
    expect(note).toHaveValue("a".repeat(140));
  });

  it.each([false, true])(
    "allows switching serial modes after submitting with allSerials=%s",
    async (allSerials) => {
      vi.mocked(fetch).mockImplementation(
        async () => new Response(JSON.stringify({ success: true })),
      );
      const { user, refetch } = renderComponent();
      await selectTargetModel(user);
      if (allSerials) {
        await user.click(screen.getByRole("radio", { name: "All serials" }));
      } else {
        await user.type(
          screen.getByRole("textbox", { name: "Serial number" }),
          "first-serial",
        );
      }
      await user.type(
        screen.getByRole("textbox", { name: "Note (Max 140 characters)" }),
        "First note",
      );
      await user.click(screen.getByRole("button", { name: "Confirm" }));
      await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
      expect(screen.getByRole("combobox")).toHaveValue("");
      expect(
        screen.getByRole("textbox", {
          name: "Note (Max 140 characters)",
        }),
      ).toHaveValue("");
      expect(
        screen.getByRole("radio", {
          name: allSerials ? "All serials" : "Enter serial",
        }),
      ).toBeChecked();

      await selectTargetModel(user);
      await user.click(
        screen.getByRole("radio", {
          name: allSerials ? "Enter serial" : "All serials",
        }),
      );
      expect(
        screen.getByRole("radio", {
          name: allSerials ? "Enter serial" : "All serials",
        }),
      ).toBeChecked();
      if (allSerials) {
        const serial = screen.getByRole("textbox", {
          name: "Serial number",
        });
        expect(serial).toHaveValue("");
        await user.type(serial, "second-serial");
      } else {
        expect(
          screen.queryByRole("textbox", {
            name: "Serial number",
          }),
        ).not.toBeInTheDocument();
      }
      await user.click(screen.getByRole("button", { name: "Confirm" }));
      await waitFor(() => expect(refetch).toHaveBeenCalledTimes(2));
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/store/test-brand/models/remodel-allowlist",
        expect.objectContaining({
          body: JSON.stringify([
            {
              "from-model": "current-model",
              "to-model": "test-model-1",
              "from-serial": allSerials ? "second-serial" : null,
              description: "",
            },
          ]),
        }),
      );
      await user.click(
        screen.getByRole("radio", {
          name: allSerials ? "All serials" : "Enter serial",
        }),
      );
      expect(
        screen.getByRole("radio", {
          name: allSerials ? "All serials" : "Enter serial",
        }),
      ).toBeChecked();
    },
  );

  it.each(["test-serial", null])(
    "blocks a conflicting remodel for serial %s",
    async (serial) => {
      const { user } = renderComponent([existingRemodel(serial)]);
      await selectTargetModel(user);
      if (serial) {
        await user.type(
          screen.getByRole("textbox", { name: "Serial number" }),
          serial,
        );
      } else {
        await user.click(screen.getByRole("radio", { name: "All serials" }));
      }
      expect(await screen.findByText(conflictMessage)).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByRole("combobox")).toHaveAccessibleErrorMessage(
        conflictMessage,
      );
      expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
      const form = screen
        .getByRole("button", { name: "Confirm" })
        .closest("form");
      expect(form).not.toBeNull();
      if (form) {
        await act(async () => {
          fireEvent.submit(form);
        });
      }
      await waitFor(() =>
        expect(screen.getByRole("combobox")).toHaveAccessibleErrorMessage(
          conflictMessage,
        ),
      );
      expect(fetch).not.toHaveBeenCalled();
      await user.click(screen.getByRole("radio", { name: "Enter serial" }));
      await user.type(
        screen.getByRole("textbox", { name: "Serial number" }),
        "-different",
      );
      await waitFor(() =>
        expect(screen.queryByText(conflictMessage)).not.toBeInTheDocument(),
      );
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-invalid",
        "false",
      );
      expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("revalidates conflicts when the remodel list or target model changes", async () => {
    useModels.mockReturnValue({
      data: [{ name: "test-model-1" }, { name: "test-model-2" }],
      isLoading: false,
      error: null,
    });
    const { user, store } = renderComponent();
    await selectTargetModel(user);
    await user.click(screen.getByRole("radio", { name: "All serials" }));
    expect(screen.queryByText(conflictMessage)).not.toBeInTheDocument();

    act(() => store.set(remodelsListState, [existingRemodel(null)]));
    expect(await screen.findByText(conflictMessage)).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox"), "test-model-2");
    await waitFor(() =>
      expect(screen.queryByText(conflictMessage)).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
    await selectTargetModel(user);
    expect(await screen.findByText(conflictMessage)).toBeInTheDocument();

    act(() => store.set(remodelsListState, []));
    await waitFor(() =>
      expect(screen.queryByText(conflictMessage)).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
  });

  it.each([
    { status: 400, message: "Unable to configure remodel" },
    {
      status: 409,
      message: "Requested remodel conflicts with existing remodels",
    },
  ])("preserves API error notifications: %s", async ({ status, message }) => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          message: "Unable to configure remodel",
        }),
        { status },
      ),
    );
    const { user, setErrorMessage, setShowErrorNotification, refetch } =
      renderComponent();
    await selectTargetModel(user);
    await user.click(screen.getByRole("radio", { name: "All serials" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => {
      expect(setErrorMessage).toHaveBeenCalledWith(message);
      expect(setShowErrorNotification).toHaveBeenCalledWith(true);
      expect(screen.getByTestId("location").textContent).toBe(remodelPath);
    });
    expect(refetch).not.toHaveBeenCalled();
  });

  it("uses a secondary router link for Cancel without submitting", async () => {
    const { user } = renderComponent();
    const cancel = screen.getByRole("link", { name: "Cancel" });
    expect(cancel).toHaveAttribute("href", remodelPath);
    expect(cancel).toHaveClass("ds", "button", "secondary");
    await user.click(cancel);
    expect(screen.getByTestId("location").textContent).toBe(remodelPath);
    expect(fetch).not.toHaveBeenCalled();
  });
});
