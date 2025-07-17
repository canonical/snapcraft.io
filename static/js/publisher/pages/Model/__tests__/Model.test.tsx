import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Model from "../Model";

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn().mockReturnValue([
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

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    model_id: "model-1",
  }),
}));

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn().mockReturnValue({
    data: [
      {
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
      },
    ],
  }),
}));

describe("Model", () => {
  it("disables the 'Save' button if the API key hasn't been modified", async () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("enables the 'Save' button when the API key has been modified", async () => {
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  it("generates a new API key when clicking the 'Generate key' button", async () => {
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    const apiKeyField: HTMLInputElement = screen.getByLabelText("API key");
    const apiKeyFieldValue = apiKeyField.value;
    expect(apiKeyFieldValue).not.toEqual(
      "K2NjWGA4iKhLmGDDQUJhJyhzS35CBLJClyNu8dAS0TWrTF3aSD",
    );
  });

  it("disables the 'Revert' button if the API key hasn't been modified", async () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Revert" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("enables the 'Revert' button when the API key has been modified", async () => {
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    expect(screen.getByRole("button", { name: "Revert" })).not.toBeDisabled();
  });

  it("resets the API when clicking the 'Revert' button", async () => {
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    expect(screen.getByLabelText("API key")).not.toHaveValue(
      "K2NjWGA4iKhLmGDDQUJhJyhzS35CBLJClyNu8dAS0TWrTF3aSD",
    );
    await user.click(screen.getByRole("button", { name: "Revert" }));
    expect(screen.getByLabelText("API key")).toHaveValue(
      "K2NjWGA4iKhLmGDDQUJhJyhzS35CBLJClyNu8dAS0TWrTF3aSD",
    );
  });
});
