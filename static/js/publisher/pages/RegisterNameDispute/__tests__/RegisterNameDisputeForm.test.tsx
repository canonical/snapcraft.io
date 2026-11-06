import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { JotaiTestProvider, storesResponse } from "../../../test-utils";

import { brandStoresState } from "../../../state/brandStoreState";

import RegisterNameDisputeForm from "../RegisterNameDisputeForm";

const testSnapName = "test-snap-name";
const testStoreName = "Test store";

window.CSRF_TOKEN = "test-csrf-token";

function renderComponent(setClaimSubmitted = vi.fn()) {
  render(
    <BrowserRouter>
      <JotaiTestProvider initialValues={[[brandStoresState, storesResponse]]}>
        <RegisterNameDisputeForm
          snapName={testSnapName}
          store={testStoreName}
          setClaimSubmitted={setClaimSubmitted}
        />
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

describe("RegisterNameDisputeForm", () => {
  test("shows snap name in heading", () => {
    renderComponent();
    const el = screen.getByText("Claim the name", { exact: false });
    expect(el.textContent).toEqual(`Claim the name ${testSnapName}`);
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

  test("links to the register snap page", () => {
    renderComponent();
    expect(
      screen.getByRole("link", { name: "Register a new name" }),
    ).toHaveAttribute("href", "/register-snap");
  });

  test("CTA button is disabled by default", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: "Submit name claim" }),
    ).toBeDisabled();
  });

  test("CTA button is enabled if comment is present", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Comment"), "This is a test comment");

    expect(
      screen.getByRole("button", { name: "Submit name claim" }),
    ).toBeEnabled();
  });

  test("submits the snap name, comment and store with the CSRF token", async () => {
    const user = userEvent.setup();
    const setClaimSubmitted = vi.fn();
    let requestBody: unknown;
    let csrfToken: string | null = null;

    server.use(
      http.post("/api/register-name-dispute", async ({ request }) => {
        requestBody = await request.json();
        csrfToken = request.headers.get("X-CSRF-Token");
        return HttpResponse.json({ success: true });
      }),
    );

    renderComponent(setClaimSubmitted);

    await user.type(screen.getByLabelText("Comment"), "This is a test comment");
    await user.click(screen.getByRole("button", { name: "Submit name claim" }));

    await waitFor(() => {
      expect(requestBody).toEqual({
        "snap-name": testSnapName,
        "claim-comment": "This is a test comment",
        store: testStoreName,
      });
    });
    expect(csrfToken).toBe("test-csrf-token");
    await waitFor(() => {
      expect(setClaimSubmitted).toHaveBeenCalledWith(true);
    });
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
    await user.click(screen.getByRole("button", { name: "Submit name claim" }));

    const button = await screen.findByRole("button", { name: "Submitting" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    resolveRequest();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Submit name claim" }),
      ).not.toHaveAttribute("aria-busy");
    });
  });
});
