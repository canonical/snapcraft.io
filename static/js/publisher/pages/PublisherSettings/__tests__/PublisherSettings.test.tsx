import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import PublisherSettings from "../PublisherSettings";

const queryClient = new QueryClient();

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useParams: () => ({
    snapId: "test-snap-id",
  }),
}));

function renderComponent() {
  render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <PublisherSettings />
      </QueryClientProvider>
    </BrowserRouter>,
  );
}

describe("PublisherSettings", () => {
  test("shows loading state by default", () => {
    renderComponent();
    expect(screen.getByText(/Loading.../)).toBeInTheDocument();
  });
});
