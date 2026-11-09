import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Model from "../Model";

vi.mock("react-redux", async (importOriginal) => ({
  ...(await importOriginal()),
  useSelector: vi.fn().mockReturnValue([
    { id: "test-id", name: "Test store", roles: ["admin"] },
    {
      id: "non-admin-store",
      name: "Non-admin store",
      roles: ["review", "view", "access"],
    },
  ]),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Model />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useParams: () => ({
    modelId: "model-1",
  }),
}));

const defaultModel = {
  "api-key": "K2NjWGA4iKhLmGDDQUJhJyhzS35CBLJClyNu8dAS0TWrTF3aSD",
  "created-at": "2023-07-13T15:56:35.088052",
  "created-by": {
    "display-name": "John Doe",
    email: "john.doe@canonical.com",
    id: "prFvYmvaBsQbXLNaVaQFV4EAcJ8zh0Ej",
    username: "johndoe",
    validation: "unproven",
  },
  name: "model-1",
  series: "16",
};

const defaultResponse = {
  data: [defaultModel],
};

vi.mock("react-query", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: vi.fn(),
}));

describe("Model", () => {
  it("keeps the API key input accessible by its label", () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue(defaultResponse);
    renderComponent();

    expect(
      screen.getByRole("textbox", { name: "API key" }),
    ).toHaveAccessibleName("API key");
  });

  it("doesn't render 'Save' and 'Revert' buttons if API key already exists", async () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue(defaultResponse);
    renderComponent();
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Revert" }),
    ).not.toBeInTheDocument();
  });

  it("doesn't render 'Generate key' button if API key already exists", async () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue(defaultResponse);
    renderComponent();
    expect(
      screen.queryByRole("button", { name: "Generate key" }),
    ).not.toBeInTheDocument();
  });

  it("sets API key field as readonly if API key already exists", async () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue(defaultResponse);
    renderComponent();
    expect(screen.getByLabelText("API key")).toHaveAttribute("readonly");
  });

  it("populates the API key field if API key already exists", async () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue(defaultResponse);
    renderComponent();
    expect(screen.getByLabelText("API key")).toHaveValue(
      defaultResponse.data[0]["api-key"],
    );
  });

  it("displays the 'Save' and 'Revert' buttons if no API key", async () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue({ data: [{ ...defaultModel, "api-key": null }] });
    renderComponent();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Revert" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revert" })).toBeDisabled();
  });

  it("enables the 'Save' and 'Revert' buttons when the API key has been modified", async () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue({ data: [{ ...defaultModel, "api-key": null }] });
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Revert" })).toBeEnabled();
  });

  it("clears the generated API key when clicking 'Revert'", async () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue({ data: [{ ...defaultModel, "api-key": null }] });
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    await user.click(screen.getByRole("button", { name: "Revert" }));
    expect(screen.getByLabelText("API key")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("generates a new API key when clicking the 'Generate key' button", async () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue({ data: [{ ...defaultModel, "api-key": null }] });
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    const apiKeyField: HTMLInputElement = screen.getByLabelText("API key");
    const apiKeyFieldValue = apiKeyField.value;
    expect(apiKeyFieldValue).not.toEqual(
      "K2NjWGA4iKhLmGDDQUJhJyhzS35CBLJClyNu8dAS0TWrTF3aSD",
    );
  });

  it("submits the generated API key when clicking 'Save'", async () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue({
      data: [{ ...defaultModel, "api-key": null }],
      refetch: vi.fn(),
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    const apiKeyField: HTMLInputElement = screen.getByLabelText("API key");
    const apiKey = apiKeyField.value;

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/models/model-1"),
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    const formData = fetchMock.mock.calls[0][1].body as FormData;
    expect(formData.get("api_key")).toBe(apiKey);
    vi.unstubAllGlobals();
  });

  it("shows the Save button as loading while saving the API key", async () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue({
      data: [{ ...defaultModel, "api-key": null }],
      refetch: vi.fn(),
    });
    let resolveSave!: (response: { ok: boolean }) => void;
    const saveResponse = new Promise<{ ok: boolean }>((resolve) => {
      resolveSave = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(saveResponse));

    try {
      renderComponent();
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Generate key" }));
      const saveButton = screen.getByRole("button", { name: "Save" });
      expect(saveButton).not.toHaveAttribute("aria-busy");

      await user.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toHaveAttribute("aria-busy", "true");
        expect(saveButton).toBeDisabled();
      });

      resolveSave({ ok: true });

      await waitFor(() => {
        expect(saveButton).not.toHaveAttribute("aria-busy");
        expect(saveButton).toBeEnabled();
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
