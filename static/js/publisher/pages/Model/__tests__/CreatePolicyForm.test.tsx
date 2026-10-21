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

import CreatePolicyForm from "../CreatePolicyForm";
import { brandIdState, brandStoresState } from "../../../state/brandStoreState";
import {
  newSigningKeyState,
  signingKeysListState,
} from "../../../state/signingKeysState";
import type { SigningKey } from "../../../types/shared";

const { useSigningKeys } = vi.hoisted(() => ({ useSigningKeys: vi.fn() }));

vi.mock("../../../hooks", () => ({ useSigningKeys }));

const policiesPath = "/admin/test-store/models/test-model/policies";
const signingKey = {
  name: "signing-key-1",
  fingerprint: "fingerprint-1",
  "sha3-384": "sha3-384-key-1",
  "created-at": "2026-01-01T00:00:00Z",
  "modified-at": null,
} satisfies SigningKey;
const secondSigningKey = {
  ...signingKey,
  name: "signing-key-2",
  fingerprint: "fingerprint-2",
  "sha3-384": "sha3-384-key-2",
};

function Navigation() {
  return (
    <>
      <p data-testid="location">{useLocation().pathname}</p>
      <Link to={`${policiesPath}/create`}>Reopen form</Link>
    </>
  );
}

const renderComponent = (selectedKey = "") => {
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
  store.set(newSigningKeyState, { name: selectedKey });
  const props = {
    setShowErrorNotification: vi.fn(),
    setShowNotification: vi.fn(),
    refetchPolicies: vi.fn(),
  };
  const component = (
    <MemoryRouter initialEntries={[`${policiesPath}/create`]}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route
              path="/admin/:id/models/:modelId/policies/*"
              element={<CreatePolicyForm {...props} />}
            />
          </Routes>
          <Navigation />
        </QueryClientProvider>
      </Provider>
    </MemoryRouter>
  );
  render(component);

  return {
    ...props,
    store,
    queryClient,
    user: userEvent.setup(),
  };
};

const selectSigningKey = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Signing key" }),
    signingKey["sha3-384"],
  );
};

describe("CreatePolicyForm", () => {
  beforeEach(() => {
    useSigningKeys.mockReturnValue({ data: [signingKey] });
  });

  afterEach(() => {
    if (vi.isMockFunction(window.setTimeout)) {
      for (const result of window.setTimeout.mock.results) {
        if (result.type === "return") {
          window.clearTimeout(result.value);
        }
      }
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows loading feedback and disables the select without signing keys", () => {
    useSigningKeys.mockReturnValue({ isLoading: true });
    renderComponent();

    expect(screen.getByText("Fetching signing keys...")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Signing key" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add policy" })).toBeDisabled();
  });

  it("shows signing-key fetch errors", () => {
    useSigningKeys.mockReturnValue({
      isError: true,
      error: new Error("Unable to load signing keys"),
    });
    renderComponent();

    expect(
      screen.getByText("Error: Unable to load signing keys"),
    ).toBeInTheDocument();
  });

  it("shows the existing create-key link when there are no signing keys", () => {
    useSigningKeys.mockReturnValue({ data: [] });
    renderComponent();

    expect(screen.getByText(/No signing keys available/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "create one" })).toHaveAttribute(
      "href",
      "/admin/test-store/models/signing-keys/create",
    );
    expect(
      screen.getByRole("combobox", { name: "Signing key" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add policy" })).toBeDisabled();
  });

  it("renders signing-key names with their SHA3-384 values in order", () => {
    useSigningKeys.mockReturnValue({ data: [signingKey, secondSigningKey] });
    renderComponent();

    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Select a signing key", signingKey.name, secondSigningKey.name]);
    expect(screen.getByRole("option", { name: signingKey.name })).toHaveValue(
      signingKey["sha3-384"],
    );
    expect(screen.getByRole("combobox", { name: "Signing key" })).toHaveValue(
      "",
    );
    expect(screen.getByRole("button", { name: "Add policy" })).toBeDisabled();
  });

  it("synchronizes selection with the atom and disables submission on the placeholder", async () => {
    const { user, store } = renderComponent();
    await selectSigningKey(user);

    expect(store.get(newSigningKeyState)).toEqual({
      name: signingKey["sha3-384"],
    });
    expect(screen.getByRole("button", { name: "Add policy" })).toBeEnabled();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Signing key" }),
      "",
    );

    expect(store.get(newSigningKeyState)).toEqual({ name: "" });
    expect(screen.getByRole("button", { name: "Add policy" })).toBeDisabled();
  });

  it("updates options when signing keys arrive after loading", async () => {
    useSigningKeys.mockReturnValue({ isLoading: true });
    const { store, user } = renderComponent();
    useSigningKeys.mockReturnValue({ data: [signingKey] });

    act(() => store.set(signingKeysListState, [signingKey]));

    expect(
      screen.queryByText("Fetching signing keys..."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Signing key" })).toBeEnabled();
    expect(
      screen.queryByText(/No signing keys available/),
    ).not.toBeInTheDocument();
    await selectSigningKey(user);
    expect(screen.getByRole("button", { name: "Add policy" })).toBeEnabled();
  });

  it("refreshes changed options without losing the selected key", async () => {
    const { store, user } = renderComponent();
    await selectSigningKey(user);
    const updatedKeys = [
      { ...signingKey, name: "Renamed signing key" },
      secondSigningKey,
    ];
    useSigningKeys.mockReturnValue({ data: updatedKeys });

    act(() => store.set(signingKeysListState, updatedKeys));

    expect(
      screen.getByRole("option", { name: "Renamed signing key" }),
    ).toHaveValue(signingKey["sha3-384"]);
    expect(
      screen.getByRole("option", { name: secondSigningKey.name }),
    ).toHaveValue(secondSigningKey["sha3-384"]);
    expect(screen.getByRole("combobox", { name: "Signing key" })).toHaveValue(
      signingKey["sha3-384"],
    );
    expect(screen.getByRole("button", { name: "Add policy" })).toBeEnabled();

    useSigningKeys.mockReturnValue({ data: [] });
    act(() => store.set(signingKeysListState, []));
    expect(
      screen.getByRole("combobox", { name: "Signing key" }),
    ).toBeDisabled();
  });

  it("reflects external selection resets while the panel remains mounted", async () => {
    const { store, user } = renderComponent(signingKey["sha3-384"]);

    expect(screen.getByRole("combobox", { name: "Signing key" })).toHaveValue(
      signingKey["sha3-384"],
    );
    act(() => store.set(newSigningKeyState, { name: "" }));
    await user.click(screen.getByRole("link", { name: "Reopen form" }));

    expect(screen.getByRole("combobox", { name: "Signing key" })).toHaveValue(
      "",
    );
    expect(screen.getByRole("button", { name: "Add policy" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await selectSigningKey(user);
    expect(screen.getByRole("button", { name: "Add policy" })).toBeEnabled();
  });

  it("clears selection and error notifications on Cancel and reopens empty", async () => {
    const { store, user, setShowErrorNotification } = renderComponent();
    await selectSigningKey(user);
    await user.click(screen.getByRole("link", { name: "Cancel" }));

    expect(store.get(newSigningKeyState)).toEqual({ name: "" });
    expect(setShowErrorNotification).toHaveBeenCalledWith(false);
    expect(screen.getByTestId("location")).toHaveTextContent(policiesPath);
    await user.click(screen.getByRole("link", { name: "Reopen form" }));
    expect(screen.getByRole("combobox", { name: "Signing key" })).toHaveValue(
      "",
    );
    expect(screen.getByRole("button", { name: "Add policy" })).toBeDisabled();
  });

  it("does not submit an empty selection, including direct form submission", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { user } = renderComponent();
    await user.click(screen.getByRole("button", { name: "Add policy" }));
    const select = screen.getByRole("combobox", { name: "Signing key" });
    await user.click(select);
    await user.keyboard("{Enter}");
    const form = select.closest("form");
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => expect(select).toHaveAttribute("aria-invalid", "true"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the selected hash and preserves saving, cache, navigation and notification behaviour", async () => {
    let resolveRequest!: (response: Response) => void;
    const fetchMock = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("CSRF_TOKEN", "test-csrf-token");
    const { user, store, queryClient, refetchPolicies, setShowNotification } =
      renderComponent();
    const cancelQueries = vi.spyOn(queryClient, "cancelQueries");
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    await selectSigningKey(user);
    await user.click(screen.getByRole("button", { name: "Add policy" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Adding new policy...")).toBeInTheDocument();
    expect(store.get(newSigningKeyState)).toEqual({ name: "" });
    expect(screen.getByRole("combobox", { name: "Signing key" })).toHaveValue(
      "",
    );
    expect(cancelQueries).toHaveBeenCalledWith({ queryKey: ["policies"] });
    expect(queryClient.getQueryData(["policies"])).toEqual([
      signingKey["sha3-384"],
    ]);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/store/test-brand/models/test-model/policies");
    expect(options?.method).toBe("POST");
    expect(options?.body).toBeInstanceOf(FormData);
    if (!(options?.body instanceof FormData)) {
      throw new Error("Expected policy form data");
    }
    expect([...options.body.entries()]).toEqual([
      ["csrf_token", "test-csrf-token"],
      ["signing_key", signingKey["sha3-384"]],
    ]);

    const timeout = vi.spyOn(window, "setTimeout");
    await act(async () => resolveRequest(new Response()));

    await waitFor(() => expect(setShowNotification).toHaveBeenCalledWith(true));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["policies"] });
    expect(refetchPolicies).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("location")).toHaveTextContent(policiesPath);
    expect(screen.queryByText("Adding new policy...")).not.toBeInTheDocument();
    const resetNotification = timeout.mock.calls.find(
      ([, delay]) => delay === 5000,
    )?.[0];
    expect(typeof resetNotification).toBe("function");
    if (typeof resetNotification === "function") {
      act(() => resetNotification());
    }
    expect(setShowNotification).toHaveBeenLastCalledWith(false);
  });

  it("preserves error feedback, selection reset and navigation on request rejection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Request failed")),
    );
    const { user, store, setShowErrorNotification } = renderComponent();
    const timeout = vi.spyOn(window, "setTimeout");
    await selectSigningKey(user);
    await user.click(screen.getByRole("button", { name: "Add policy" }));

    await waitFor(() =>
      expect(setShowErrorNotification).toHaveBeenCalledWith(true),
    );
    expect(store.get(newSigningKeyState)).toEqual({ name: "" });
    expect(screen.getByTestId("location")).toHaveTextContent(policiesPath);
    expect(screen.queryByText("Adding new policy...")).not.toBeInTheDocument();
    const resetNotification = timeout.mock.calls.find(
      ([, delay]) => delay === 5000,
    )?.[0];
    expect(typeof resetNotification).toBe("function");
    if (typeof resetNotification === "function") {
      act(() => resetNotification());
    }
    expect(setShowErrorNotification).toHaveBeenLastCalledWith(false);
  });
});
