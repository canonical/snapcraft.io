import { RecoilRoot } from "recoil";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import RegisterSnap from "../RegisterSnap";

const queryClient = new QueryClient();

function renderComponent() {
  return render(
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <RegisterSnap />
        </BrowserRouter>
      </QueryClientProvider>
    </RecoilRoot>,
  );
}

const storesApiResponse = {
  success: true,
  data: [
    {
      id: "ubuntu",
      name: "Global",
    },
    {
      id: "test-store",
      name: "Test store",
    },
  ],
};

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

describe("RegisterSnap", () => {
  test("selects global store as default", async () => {
    server.use(
      http.get("/api/stores", () => {
        return HttpResponse.json(storesApiResponse);
      }),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText("Store")).toHaveValue("ubuntu");
    });
  });

  test("disables public and private inputs by default", async () => {
    server.use(
      http.get("/api/stores", () => {
        return HttpResponse.json(storesApiResponse);
      }),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText("Public")).toBeDisabled();
      expect(screen.getByLabelText("Private")).toBeDisabled();
    });
  });

  test("selects private by default", async () => {
    server.use(
      http.get("/api/stores", () => {
        return HttpResponse.json(storesApiResponse);
      }),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText("Private")).toBeChecked();
    });
  });

  test("register button is enabled by default", async () => {
    server.use(
      http.get("/api/stores", () => {
        return HttpResponse.json(storesApiResponse);
      }),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Register" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });

  test("enables register button if snap name has value", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("/api/stores", () => {
        return HttpResponse.json(storesApiResponse);
      }),
    );

    renderComponent();

    await waitFor(() => {
      user.type(screen.getByLabelText("Snap name"), "Test");
      expect(
        screen.getByRole("button", { name: "Register" }),
      ).not.toHaveAttribute("aria-disabled");
    });
  });

  test("enabled public and private fields if not global store", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("/api/stores", () => {
        return HttpResponse.json(storesApiResponse);
      }),
    );

    renderComponent();

    await waitFor(() => {
      user.selectOptions(screen.getByLabelText("Store"), "Test store");
      expect(screen.getByLabelText("Public")).not.toBeDisabled();
      expect(screen.getByLabelText("Private")).not.toBeDisabled();
    });
  });
});
