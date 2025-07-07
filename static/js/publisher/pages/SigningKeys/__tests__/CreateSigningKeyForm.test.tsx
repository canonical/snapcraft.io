import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import CreateSigningKeyForm from "../CreateSigningKeyForm";

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
          <CreateSigningKeyForm
            setShowNotification={jest.fn()}
            setErrorMessage={jest.fn()}
            refetch={jest.fn()}
          />
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>,
  );
};

describe("CreateSigningKeyForm", () => {
  it("disables 'Add signing key' button if no new signing key name", async () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: "Add signing key" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("enables 'Add signing key' button if there is a new signing key name", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(
      screen.getByRole("textbox", { name: "Signing key name" }),
      "test-signing key-name",
    );
    expect(
      screen.getByRole("button", { name: "Add signing key" }),
    ).not.toBeDisabled();
  });
});
