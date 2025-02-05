import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import SigningKeys from "../SigningKeys";

const mockFilterQuery = "signing key-1";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useSearchParams: () => [new URLSearchParams({ filter: mockFilterQuery })],
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function renderComponent() {
  return render(
    <RecoilRoot>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <SigningKeys />
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>,
  );
}

describe("SigningKeys", () => {
  it("displays a link to create a new signing key", () => {
    renderComponent();
    expect(
      screen.getByRole("link", { name: "Create new signing key" }),
    ).toBeInTheDocument();
  });

  it("shows a create signing key form when 'Create new signing key' button clicked", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(
      screen.getByRole("link", { name: "Create new signing key" }),
    );
    expect(
      screen.getByRole("textbox", { name: "Signing key name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add signing key" }),
    ).toBeInTheDocument();
  });

  it("displays a filter input", () => {
    renderComponent();
    expect(screen.getByLabelText("Signing keys")).toBeInTheDocument();
  });

  it("populates filter with the filter query parameter", () => {
    renderComponent();
    expect(screen.getByLabelText("Signing keys")).toHaveValue(mockFilterQuery);
  });
});
