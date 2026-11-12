import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
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

import CreateModelForm from "../CreateModelForm";
import { brandIdState, brandStoresState } from "../../../state/brandStoreState";
import {
  modelsListFilterState,
  modelsListState,
} from "../../../state/modelsState";
import type { Model } from "../../../types/shared";

const modelsPath = "/admin/test-store/models";
const apiKey = "A".repeat(50);
const keyDescription = (length: number) =>
  `API key should be exactly 50 alphanumeric characters long (${length}/50)`;
const existingModel: Model = {
  name: "existing-model",
  "api-key": apiKey,
  "created-at": "2026-01-01T00:00:00Z",
};

function Navigation() {
  return (
    <>
      <p data-testid="location">{useLocation().pathname}</p>
      <Link to={`${modelsPath}/create`}>Reopen form</Link>
    </>
  );
}

const renderComponent = (models: Model[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const store = createStore();
  store.set(brandIdState, "test-brand");
  store.set(brandStoresState, [
    { id: "test-store", name: "Test store", snaps: [] },
  ]);
  store.set(modelsListState, models);
  const props = {
    setShowErrorNotification: vi.fn(),
    setShowNotification: vi.fn(),
  };

  render(
    <MemoryRouter initialEntries={[`${modelsPath}/create`]}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route
              path="/admin/:id/models/*"
              element={<CreateModelForm {...props} />}
            />
          </Routes>
          <Navigation />
        </QueryClientProvider>
      </Provider>
    </MemoryRouter>,
  );

  return { ...props, store, queryClient, user: userEvent.setup() };
};

const nameInput = () => screen.getByRole("textbox", { name: "Name" });
const keyInput = () =>
  screen.getByRole<HTMLInputElement>("textbox", { name: "API key" });
const submitButton = () => screen.getByRole("button", { name: "Add model" });

describe("CreateModelForm", () => {
  beforeEach(() => {
    window.CSRF_TOKEN = "test-csrf-token";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves the title, brand, labels, guidance, and required fields", () => {
    renderComponent();
    expect(document.title).toBe("Create model in Test store - Snapcraft");
    expect(
      screen.getByRole("heading", { name: "Create new model" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Test store")).toBeInTheDocument();
    expect(nameInput().closest(".ds.field")).toHaveAttribute(
      "id",
      "model-name-field",
    );
    expect(nameInput()).toHaveAttribute("placeholder", "e.g. display-name-123");
    expect(nameInput()).toHaveAttribute("aria-required", "true");
    expect(nameInput()).toHaveAccessibleDescription(
      "Name should contain lowercase alphanumeric characters and hyphens only",
    );
    expect(keyInput().closest(".ds.field")).toHaveAttribute(
      "id",
      "api-key-field",
    );
    expect(keyInput()).toHaveAttribute("aria-required", "true");
    expect(keyInput()).toHaveAccessibleDescription(keyDescription(0));
    expect(screen.getByText("* Mandatory field")).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it("uses the fallback page title when the store is unavailable", () => {
    const { store } = renderComponent();
    act(() => store.set(brandStoresState, []));
    expect(document.title).toBe("Create model - Snapcraft");
    expect(screen.queryByText("Test store")).not.toBeInTheDocument();
  });

  it.each([
    { name: "", key: "" },
    { name: "new-model", key: "" },
    { name: "", key: apiKey },
    { name: "new-model", key: "A".repeat(49) },
    { name: "new-model", key: "A".repeat(51) },
  ])("disables submission for incomplete values: %s", ({ name, key }) => {
    renderComponent();
    fireEvent.change(nameInput(), { target: { value: name } });
    fireEvent.change(keyInput(), { target: { value: key } });
    expect(submitButton()).toBeDisabled();
  });

  it("enables submission at exactly 50 characters and disables it after clearing", async () => {
    const { user } = renderComponent();
    await user.type(nameInput(), "new-model");
    await user.type(keyInput(), apiKey);
    expect(submitButton()).toBeEnabled();
    expect(keyInput()).toHaveAccessibleDescription(keyDescription(50));

    await user.clear(nameInput());
    expect(submitButton()).toBeDisabled();
    await user.type(nameInput(), "another-model");
    expect(submitButton()).toBeEnabled();
    await user.clear(keyInput());
    expect(submitButton()).toBeDisabled();
    expect(keyInput()).toHaveAccessibleDescription(
      expect.stringContaining(keyDescription(0)),
    );
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    expect(keyInput()).toHaveAccessibleDescription(keyDescription(50));
    expect(submitButton()).toBeEnabled();
    await user.click(submitButton());
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it("limits typed API keys to 50 characters", async () => {
    const { user } = renderComponent();
    await user.type(keyInput(), `${apiKey}extra`);
    expect(keyInput()).toHaveAttribute("maxlength", "50");
    expect(keyInput()).toHaveValue(apiKey);
    expect(keyInput()).toHaveAccessibleDescription(keyDescription(50));
  });

  it("does not introduce name or API-key character restrictions", async () => {
    const { user } = renderComponent();
    await user.type(nameInput(), "Mixed_Case model!");
    await user.type(keyInput(), "!".repeat(50));
    expect(submitButton()).toBeEnabled();
    await user.click(submitButton());
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it("shows duplicate-name errors and recovers when the name changes or is cleared", async () => {
    const { user } = renderComponent([existingModel]);
    await user.type(nameInput(), existingModel.name);
    await user.type(keyInput(), apiKey);
    expect(
      await screen.findByText("Model existing-model already exists"),
    ).toBeInTheDocument();
    expect(nameInput()).toHaveAttribute("aria-invalid", "true");
    expect(submitButton()).toBeDisabled();

    await user.type(nameInput(), "-new");
    await waitFor(() =>
      expect(
        screen.queryByText("Model existing-model already exists"),
      ).not.toBeInTheDocument(),
    );
    expect(submitButton()).toBeEnabled();
    await user.clear(nameInput());
    expect(submitButton()).toBeDisabled();
    expect(screen.queryByText(/already exists/)).not.toBeInTheDocument();
  });

  it("revalidates duplicate names when the model list changes", async () => {
    const { user, store } = renderComponent();
    await user.type(nameInput(), existingModel.name);
    await user.type(keyInput(), apiKey);
    expect(submitButton()).toBeEnabled();

    act(() => store.set(modelsListState, [existingModel]));
    expect(
      await screen.findByText("Model existing-model already exists"),
    ).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();

    act(() => store.set(modelsListState, []));
    await waitFor(() =>
      expect(
        screen.queryByText("Model existing-model already exists"),
      ).not.toBeInTheDocument(),
    );
    expect(submitButton()).toBeEnabled();
  });

  it("preserves duplicate checks against the filtered model list", async () => {
    const { user, store } = renderComponent([existingModel]);
    act(() => store.set(modelsListFilterState, "other-model"));
    await user.type(nameInput(), existingModel.name);
    await user.type(keyInput(), apiKey);
    expect(submitButton()).toBeEnabled();
    expect(screen.queryByText(/already exists/)).not.toBeInTheDocument();

    act(() => store.set(modelsListFilterState, ""));
    expect(
      await screen.findByText("Model existing-model already exists"),
    ).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it("generates an editable alphanumeric key and updates the counter without submitting", async () => {
    const { user } = renderComponent();
    expect(
      screen.getByRole("button", { name: "Generate key" }),
    ).toHaveAttribute("type", "button");
    await user.type(nameInput(), "new-model");
    await user.type(keyInput(), "old-key");
    expect(keyInput()).toHaveAccessibleDescription(keyDescription(7));
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    expect(keyInput().value).toMatch(/^[a-zA-Z0-9]{50}$/);
    expect(keyInput()).toHaveAccessibleDescription(keyDescription(50));
    expect(submitButton()).toBeEnabled();
    expect(fetch).not.toHaveBeenCalled();

    await user.click(keyInput());
    await user.keyboard("{End}{Backspace}");
    expect(keyInput()).toHaveAccessibleDescription(keyDescription(49));
    expect(submitButton()).toBeDisabled();
    await user.type(keyInput(), "Z");
    expect(submitButton()).toBeEnabled();
  });

  it("submits a generated key with the existing multipart payload and mutation lifecycle", async () => {
    let resolveRequest!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const timeouts = vi.spyOn(globalThis, "setTimeout");
    const { user, store, queryClient, setShowNotification } = renderComponent([
      existingModel,
    ]);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    await user.type(nameInput(), "new-model");
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    const generatedKey = keyInput().value;
    await user.click(submitButton());

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/store/test-brand/models");
    expect(options?.method).toBe("POST");
    expect(options?.body).toBeInstanceOf(FormData);
    expect(Array.from((options?.body as FormData).entries())).toEqual([
      ["csrf_token", "test-csrf-token"],
      ["name", "new-model"],
      ["api_key", generatedKey],
    ]);
    expect(store.get(modelsListState)).toEqual([
      {
        name: "new-model",
        "api-key": generatedKey,
        "created-at": expect.any(String),
      },
      existingModel,
    ]);
    expect(screen.getByText("Creating new model...")).toBeInTheDocument();
    expect(nameInput()).toHaveValue("");
    expect(keyInput()).toHaveValue("");
    expect(keyInput()).toHaveAccessibleDescription(keyDescription(0));
    expect(setShowNotification).not.toHaveBeenCalled();

    await act(async () => resolveRequest(new Response()));
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(modelsPath),
    );
    expect(screen.getByTestId("location")).not.toHaveTextContent("/create");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["models"] });
    expect(setShowNotification).toHaveBeenCalledWith(true);
    expect(screen.queryByText("Creating new model...")).not.toBeInTheDocument();
    const resetNotification = timeouts.mock.calls.find(
      ([, delay]) => delay === 5000,
    )?.[0];
    expect(typeof resetNotification).toBe("function");
    if (typeof resetNotification === "function") {
      act(() => resetNotification());
    }
    expect(setShowNotification).toHaveBeenLastCalledWith(false);

    await user.click(screen.getByRole("link", { name: "Reopen form" }));
    expect(nameInput()).toHaveValue("");
    expect(keyInput()).toHaveValue("");
    expect(submitButton()).toBeDisabled();
  });

  it("cancels without submitting, clears errors and fields, and stays empty on reopening", async () => {
    const { user, setShowErrorNotification } = renderComponent([existingModel]);
    await user.type(nameInput(), existingModel.name);
    await user.type(keyInput(), apiKey);
    expect(
      await screen.findByText("Model existing-model already exists"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      modelsPath,
    );
    await user.click(screen.getByRole("link", { name: "Cancel" }));
    expect(screen.getByTestId("location")).toHaveTextContent(modelsPath);
    expect(screen.getByTestId("location")).not.toHaveTextContent("/create");
    expect(setShowErrorNotification).toHaveBeenCalledWith(false);
    expect(fetch).not.toHaveBeenCalled();

    await user.click(screen.getByRole("link", { name: "Reopen form" }));
    expect(nameInput()).toHaveValue("");
    expect(keyInput()).toHaveValue("");
    expect(keyInput()).toHaveAccessibleDescription(keyDescription(0));
    expect(screen.queryByText(/already exists/)).not.toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it("preserves error notification, cleanup, and navigation when the request rejects", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));
    const timeouts = vi.spyOn(globalThis, "setTimeout");
    const { user, setShowErrorNotification } = renderComponent();
    await user.type(nameInput(), "new-model");
    await user.type(keyInput(), apiKey);
    await user.click(submitButton());

    await waitFor(() =>
      expect(setShowErrorNotification).toHaveBeenCalledWith(true),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(modelsPath);
    expect(screen.getByTestId("location")).not.toHaveTextContent("/create");
    expect(nameInput()).toHaveValue("");
    expect(keyInput()).toHaveValue("");
    expect(screen.queryByText("Creating new model...")).not.toBeInTheDocument();
    const resetNotification = timeouts.mock.calls.find(
      ([, delay]) => delay === 5000,
    )?.[0];
    expect(typeof resetNotification).toBe("function");
    if (typeof resetNotification === "function") {
      act(() => resetNotification());
    }
    expect(setShowErrorNotification).toHaveBeenLastCalledWith(false);
  });
});
