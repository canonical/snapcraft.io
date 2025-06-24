import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import Categories from "../Categories";

const queryClient = new QueryClient();

function renderComponent() {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Categories />
      </QueryClientProvider>
      ,
    </BrowserRouter>,
  );
}

const handlers = [
  http.get("/store.json", () => {
    return HttpResponse.json({
      categories: [
        { name: "test-category-1", display_name: "Test Category 1" },
        { name: "test-category-2", display_name: "Test Category 2" },
      ],
    });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  queryClient.clear();
});

afterAll(() => {
  server.close();
});

describe("Categories", () => {
  test("renders category title", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Test Category 1")).toBeInTheDocument();
    });
  });

  test("renders category link", async () => {
    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "Test Category 1" }),
      ).toHaveAttribute("href", "/store?categories=test-category-1&page=1");
    });
  });
});
