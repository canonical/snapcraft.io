import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import Policies from "./Policies";
import { store } from "../../store";

const mockFilterQuery = "1.7";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useSearchParams: () => [new URLSearchParams({ filter: mockFilterQuery })],
  };
});

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

function renderComponent() {
  return render(
    <Provider store={store}>
      <RecoilRoot>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <Policies />
          </QueryClientProvider>
        </BrowserRouter>
      </RecoilRoot>
    </Provider>,
  );
}

describe("Policies", () => {
  it("displays a link to create a new policy", () => {
    renderComponent();
    expect(
      screen.getByRole("link", { name: "Create policy" }),
    ).toBeInTheDocument();
  });

  it("shows a create policy form when 'Create new policy' button clicked", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("link", { name: "Create policy" }));
    expect(
      screen.getByRole("combobox", { name: "Signing key" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add policy" }),
    ).toBeInTheDocument();
  });

  it("displays a filter input", () => {
    renderComponent();
    expect(screen.getByLabelText("Search policies")).toBeInTheDocument();
  });

  it("populates filter with the filter query parameter", () => {
    renderComponent();
    expect(screen.getByLabelText("Search policies")).toHaveValue(
      mockFilterQuery,
    );
  });
});
