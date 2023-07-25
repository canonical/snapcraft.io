import React from "react";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Model from "./Model";

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
    <RecoilRoot>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <Model />
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>
  );
};

const mockModel = {
  "api-key": "K2NjWGA4iKhLmGDDQUJhJyhzS35CBLJClyNu8dAS0TWrTF3aSD",
  "created-at": "2023-07-13T15:56:35.088052",
  "created-by": {
    "display-name": "Steve Rydz",
    email: "steve.rydz@canonical.com",
    id: "prFvYmvaBsQbXLNaVaQFV4EAcJ8zh0Ej",
    username: "steverydz",
    validation: "unproven",
  },
  name: "model-1",
  series: "16",
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
          "display-name": "Steve Rydz",
          email: "steve.rydz@canonical.com",
          id: "prFvYmvaBsQbXLNaVaQFV4EAcJ8zh0Ej",
          username: "steverydz",
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
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
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
    expect(apiKeyFieldValue).not.toEqual(mockModel["api-key"]);
  });

  it("resets the API when clicking the 'Revert' button", async () => {
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Generate key" }));
    expect(screen.getByLabelText("API key")).not.toHaveValue(
      mockModel["api-key"]
    );
    await user.click(screen.getByRole("button", { name: "Revert" }));
    expect(screen.getByLabelText("API key")).toHaveValue(mockModel["api-key"]);
  });
});
