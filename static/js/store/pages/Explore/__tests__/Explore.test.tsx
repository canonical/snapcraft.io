import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import Explore from "../Explore";

import { mockRecommendations } from "../../../test-utils";

const queryClient = new QueryClient();

function renderComponent() {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Explore />
      </QueryClientProvider>
      ,
    </BrowserRouter>,
  );
}

const handlers = [
  http.get("https://recommendations.snapcraft.io/api/category/popular", () => {
    return HttpResponse.json(mockRecommendations);
  }),
  http.get("https://recommendations.snapcraft.io/api/category/recent", () => {
    return HttpResponse.json(mockRecommendations);
  }),
  http.get("https://recommendations.snapcraft.io/api/category/trending", () => {
    return HttpResponse.json(mockRecommendations);
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

describe("Explore", () => {
  test("renders hero", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The app store for Linux",
      }),
    ).toBeInTheDocument();
  });

  test("renders search", () => {
    renderComponent();
    expect(screen.getByLabelText("Search Snapcraft")).toBeInTheDocument();
  });

  test("renders updated snaps", async () => {
    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Recently updated snaps",
        }),
      ).toBeInTheDocument();
    });
  });

  test("renders popular snaps", async () => {
    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 2, name: "Most popular snaps" }),
      ).toBeInTheDocument();
    });
  });

  test("renders trending snaps", async () => {
    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 2, name: "Trending snaps" }),
      ).toBeInTheDocument();
    });
  });
});
