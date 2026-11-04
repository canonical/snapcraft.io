import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { JotaiTestProvider, storesResponse } from "../../../test-utils";

import { brandStoresState } from "../../../state/brandStoreState";

import RequestReservedName from "../RequestReservedName";

const testSnapName = "test-snap-name";
const testStoreName = "Test store";

window.CSRF_TOKEN = "test-csrf-token";

function renderComponent() {
  render(
    <BrowserRouter>
      <JotaiTestProvider initialValues={[[brandStoresState, storesResponse]]}>
        <RequestReservedName />
      </JotaiTestProvider>
    </BrowserRouter>,
  );
}

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useSearchParams: () => [
    new URLSearchParams({
      snap_name: testSnapName,
      store: testStoreName,
    }),
  ],
}));

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

describe("RequestReservedName", () => {
  test("shows snap name in heading", () => {
    renderComponent();
    const el = screen.getByText("Request reserved name", { exact: false });
    expect(el.textContent).toEqual(`Request reserved name ${testSnapName}`);
  });

  test("shows store name in form field", () => {
    renderComponent();
    expect(screen.getByLabelText("Store")).toHaveValue(testStoreName);
  });

  test("shows snap name in form field", () => {
    renderComponent();
    expect(screen.getByLabelText("Snap name")).toHaveValue(testSnapName);
  });

  test("store and snap name fields are read-only", () => {
    renderComponent();
    expect(screen.getByLabelText("Store")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Snap name")).toHaveAttribute("readonly");
  });

  test("comment field has a description", () => {
    renderComponent();
    expect(screen.getByLabelText("Comment")).toHaveAccessibleDescription(
      "Why you have rights to claim this name",
    );
  });

  test("links back to the register snap page", () => {
    renderComponent();
    expect(screen.getByRole("link", { name: "Register snap" })).toHaveAttribute(
      "href",
      "/register-snap",
    );
  });

  test("CTA button is disabled by default", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: "Yes, I am sure" }),
    ).toBeDisabled();
  });

  test("CTA button is enabled if comment is present", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Comment"), "This is a test comment");

    expect(
      screen.getByRole("button", { name: "Yes, I am sure" }),
    ).toBeEnabled();
  });

  test("submits the snap name and comment with the CSRF token", async () => {
    const user = userEvent.setup();
    let requestBody: unknown;
    let csrfToken: string | null = null;

    server.use(
      http.post("/api/register-name-dispute", async ({ request }) => {
        requestBody = await request.json();
        csrfToken = request.headers.get("X-CSRFToken");
        return HttpResponse.json({ success: true });
      }),
    );

    renderComponent();

    await user.type(screen.getByLabelText("Comment"), "This is a test comment");
    await user.click(screen.getByRole("button", { name: "Yes, I am sure" }));

    await waitFor(() => {
      expect(requestBody).toEqual({
        "snap-name": testSnapName,
        "claim-comment": "This is a test comment",
      });
    });
    expect(csrfToken).toBe("test-csrf-token");
  });

  test("CTA button shows a loading state while submitting", async () => {
    const user = userEvent.setup();
    let resolveRequest!: () => void;
    const requestReceived = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.post("/api/register-name-dispute", async () => {
        await requestReceived;
        return HttpResponse.json({ success: true });
      }),
    );

    renderComponent();

    await user.type(screen.getByLabelText("Comment"), "This is a test comment");
    await user.click(screen.getByRole("button", { name: "Yes, I am sure" }));

    const button = await screen.findByRole("button", { name: "Requesting" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    resolveRequest();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Yes, I am sure" }),
      ).not.toHaveAttribute("aria-busy");
    });
  });

  test("shows notification if form submitted successfully", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("/api/register-name-dispute", () => {
        return HttpResponse.json({
          success: true,
        });
      }),
    );

    renderComponent();

    await user.type(screen.getByLabelText("Comment"), "This is a test comment");
    await user.click(screen.getByRole("button", { name: "Yes, I am sure" }));

    await waitFor(() => {
      expect(
        screen.getByText("Your claim has been submitted and will be reviewed"),
      ).toBeInTheDocument();
    });
  });

  test("shows notification if error when submitting form", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("/api/register-name-dispute", () => {
        return HttpResponse.json({
          success: false,
          message: "Test error message",
        });
      }),
    );

    renderComponent();

    await user.type(screen.getByLabelText("Comment"), "This is a test comment");
    await user.click(screen.getByRole("button", { name: "Yes, I am sure" }));

    await waitFor(() => {
      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });
  });
});
