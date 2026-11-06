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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RegisterSnap />
      </BrowserRouter>
    </QueryClientProvider>,
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
      expect(screen.getByRole("radio", { name: /public/i })).toBeDisabled();
      expect(screen.getByRole("radio", { name: /private/i })).toBeDisabled();
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
      expect(screen.getByRole("radio", { name: /private/i })).toBeChecked();
    });
  });

  test("register button is disabled by default", async () => {
    server.use(
      http.get("/api/stores", () => {
        return HttpResponse.json(storesApiResponse);
      }),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
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

    await user.type(await screen.findByLabelText("Snap name"), "test");

    expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
  });

  test("enables public and private fields if not global store", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("/api/stores", () => {
        return HttpResponse.json(storesApiResponse);
      }),
    );

    renderComponent();

    await user.selectOptions(
      await screen.findByLabelText("Store"),
      "Test store",
    );

    expect(screen.getByRole("radio", { name: /public/i })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /private/i })).toBeEnabled();
  });
});
