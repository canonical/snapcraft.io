import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import PublisherSettings from "../PublisherSettings";

const queryClient = new QueryClient();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    snapId: "test-snap-id",
  }),
}));

function renderComponent() {
  render(
    <BrowserRouter>
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          <PublisherSettings />
        </QueryClientProvider>
      </RecoilRoot>
    </BrowserRouter>,
  );
}

describe("PublisherSettings", () => {
  test("shows snap name link in title", () => {
    renderComponent();
    expect(
      screen.getByRole("link", {
        name: "test-snap-id",
      }),
    ).toBeInTheDocument();
  });

  test("shows 'Settings' tab as selected", () => {
    renderComponent();
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("shows loading state by default", () => {
    renderComponent();
    expect(screen.getByText(/Loading.../)).toBeInTheDocument();
  });
});
