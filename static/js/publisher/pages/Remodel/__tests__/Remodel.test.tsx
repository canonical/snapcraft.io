import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

import Remodel from "../Remodel";

const mockFilterQuery = "test-model";

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useSearchParams: () => [new URLSearchParams({ filter: mockFilterQuery })],
}));

vi.mock("../../Portals/Portals", async (importOriginal) => ({
  ...(await importOriginal()),
  PortalEntrance: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
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
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Remodel />
      </QueryClientProvider>
    </BrowserRouter>,
  );
}

describe("Remodel", () => {
  it("displays a filter input", () => {
    renderComponent();
    expect(screen.getByLabelText("Search remodels")).toBeInTheDocument();
  });

  it("populates filter with the filter query parameter", () => {
    renderComponent();
    expect(screen.getByLabelText("Search remodels")).toHaveValue(
      mockFilterQuery,
    );
  });
});
