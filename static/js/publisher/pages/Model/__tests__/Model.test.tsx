import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
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
    model_id: "model-1",
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
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Revert" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revert" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("enables the 'Save' and 'Revert' buttons when the API key has been modified", async () => {
    // @ts-expect-error - Mocking useQuery without providing types for the mock data
    useQuery.mockReturnValue({ data: [{ ...defaultModel, "api-key": null }] });
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    expect(screen.getByRole("button", { name: "Save" })).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(screen.getByRole("button", { name: "Revert" })).not.toHaveAttribute(
      "aria-disabled",
    );
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
});
