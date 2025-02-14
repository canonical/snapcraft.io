import { RecoilRoot } from "recoil";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import Builds from "../Builds";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useParams: () => ({
      snapId: "test-snap-id",
    }),
  };
});

const queryClient = new QueryClient();

function renderComponent() {
  return render(
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Builds />
        </BrowserRouter>
      </QueryClientProvider>
    </RecoilRoot>,
  );
}

const server = setupServer();

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("Build", () => {
  test("it shows login to GitHub", async () => {
    server.use(
      http.get("/api/test-snap-id/repo", () => {
        return HttpResponse.json({ data: null });
      }),
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/Login to your GitHub account to start building/),
      ).toBeInTheDocument();
    });
  });

  test("it shows connected to GitHub", async () => {
    server.use(
      http.get("/api/test-snap-id/repo", () => {
        return HttpResponse.json({
          success: true,
          message: "",
          data: {
            github_orgs: [
              {
                login: "canonical",
                name: "Canonical",
              },
            ],
            github_repository: null,
            github_user: {
              avatarUrl: "https://gravatar.com/avatar",
              login: "johndoe",
              name: "John Doe",
            },
          },
        });
      }),
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/Your GitHub account is connected/),
      ).toBeInTheDocument();
    });
  });
});
