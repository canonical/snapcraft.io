import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import CreatePolicyForm from "./CreatePolicyForm";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

const renderComponent = () => {
  return render(
    <RecoilRoot>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <CreatePolicyForm
            setShowErrorNotification={jest.fn()}
            setShowNotification={jest.fn()}
            refetchPolicies={jest.fn()}
          />
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>,
  );
};

describe("CreatePolicyForm", () => {
  it("shows a message if there are no available signing keys", () => {
    // @ts-expect-error
    useQuery.mockReturnValue({ data: [] });
    renderComponent();
    expect(screen.getByText(/No signing keys available/)).toBeInTheDocument();
  });

  it("disables the 'Add policy' button if there is no selected signing key", () => {
    // @ts-expect-error
    useQuery.mockReturnValue({
      data: [
        {
          name: "signing-key-1",
          fingerprint: "A8BC257825695F43BFC83889A6583339",
          "sha3-384":
            "-r3_wh8I2TzfSq4R6SOWPJfsTl8AWu7AuvduEhx5Gr95Rwt61IPLPnVyDamY423_",
        },
      ],
    });
    renderComponent();
    expect(screen.getByRole("button", { name: "Add policy" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("enables the 'Add policy' button if a signing key is selected", async () => {
    // @ts-expect-error
    useQuery.mockReturnValue({
      data: [
        {
          name: "signing-key-1",
          fingerprint: "A8BC257825695F43BFC83889A6583339",
          "sha3-384":
            "-r3_wh8I2TzfSq4R6SOWPJfsTl8AWu7AuvduEhx5Gr95Rwt61IPLPnVyDamY423_",
        },
      ],
    });
    renderComponent();
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Signing key"), [
      "signing-key-1",
    ]);
    expect(
      screen.getByRole("button", { name: "Add policy" }),
    ).not.toBeDisabled();
  });
});
