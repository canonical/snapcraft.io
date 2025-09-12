import { BrowserRouter } from "react-router-dom";
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
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <DeactivateSigningKeyModal
          setModalOpen={vi.fn()}
          handleDisable={vi.fn()}
          isDeleting={false}
          signingKey={{
            name: "test-signing-key",
            "created-at": "2025-01-30",
            "modified-at": null,
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>,
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
