import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

import DeactivateSigningKeyModal from "../DeactivateSigningKeyModal";

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
          <DeactivateSigningKeyModal
            setModalOpen={jest.fn()}
            handleDisable={jest.fn()}
            isDeleting={false}
            signingKey={{
              name: "test-signing-key",
              "created-at": "2025-01-30",
              "modified-at": null,
            }}
          />
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>,
  );
};

describe("DeactivateSigningKeyModal", () => {
  it("Displays correct key in confirmation message", async () => {
    renderComponent();
    expect(
      screen.getByText(
        /This will permanently disable the signing key test-signing-key/,
      ),
    ).toBeInTheDocument();
  });
});
