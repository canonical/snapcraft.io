import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import RegisterNameDispute from "../RegisterNameDispute";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useSearchParams: () => [
      new URLSearchParams({ "snap-name": "test-snap-id", store: "ubuntu" }),
    ],
  };
});

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn().mockReturnValue({
    data: [
      {
        id: "ubuntu",
        name: "Global",
        roles: ["view", "access"],
      },
    ],
    isLoading: false,
  }),
}));

const queryClient = new QueryClient();

function renderComponent() {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <RegisterNameDispute />
      </QueryClientProvider>
    </BrowserRouter>,
  );
}

describe("RegisterNameDispute", () => {
  test("the snap name is shown", () => {
    renderComponent();
    const el = screen.getByText("Claim the name", { exact: false });
    expect(el.textContent).toEqual("Claim the name test-snap-id");
  });

  test("store field shows correct store", () => {
    renderComponent();
    expect(screen.getByLabelText("Store")).toHaveValue("Global");
  });

  test("snap name field show correct snap", () => {
    renderComponent();
    expect(screen.getByLabelText("Snap name")).toHaveValue("test-snap-id");
  });

  test("'Register a new name' link is on page", () => {
    renderComponent();
    expect(
      screen.getByRole("link", { name: "Register a new name" }),
    ).toHaveAttribute("href", "/register-snap");
  });

  test("'Submit name claim' button is disabled", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: "Submit name claim" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  test("'adding comment enables 'Submit name claim' button", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(screen.getByLabelText("Comment"), "Test comment");
    expect(
      screen.getByRole("button", { name: "Submit name claim" }),
    ).not.toHaveAttribute("aria-disabled");
  });
});
