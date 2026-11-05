import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import RegisterSnapForm from "../RegisterSnapForm";

window.CSRF_TOKEN = "test-csrf-token";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => mockNavigate,
}));

const availableStores = [
  { id: "ubuntu", name: "Global" },
  { id: "test-store", name: "Test store" },
];

type TestProps = {
  isSending?: boolean;
  setIsSending?: () => void;
  setRegistrationResponse?: () => void;
  stores?: { id: string; name: string }[];
};

// Mirrors how `RegisterSnap` owns the selected store
function Harness({
  isSending = false,
  setIsSending = vi.fn(),
  setRegistrationResponse = vi.fn(),
  stores = [],
}: TestProps) {
  const [selectedStore, setSelectedStore] = useState("ubuntu");

  return (
    <BrowserRouter>
      <RegisterSnapForm
        isSending={isSending}
        setIsSending={setIsSending}
        setRegistrationResponse={setRegistrationResponse}
        availableStores={stores}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
      />
    </BrowserRouter>
  );
}

function renderComponent(props: TestProps = {}) {
  return render(<Harness {...props} />);
}

const server = setupServer();

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  mockNavigate.mockClear();
});

afterAll(() => {
  server.close();
});

describe("RegisterSnapForm", () => {
  test("form disabled if no snap name", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  });

  test("form disabled if snap name longer than 40 characters", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(
      screen.getByLabelText("Snap name"),
      "thisisalongsnapnamethatislongerthan40characters",
    );

    expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  });

  test("form disabled if snap name contains uppercase characters", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Snap name"), "Test");

    expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  });

  test("form disabled if snap name contains no letters", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Snap name"), "123");

    expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  });

  test("form disabled if snap name starts with hyphen", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Snap name"), "-test-snap");

    expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  });

  test("form disabled if snap name ends with hyphen", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Snap name"), "test-snap-");

    expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  });

  test("form enabled if snap name meets requirements", async () => {
    // Requirements are:
    // - Less than 40 characters
    // - Only lowercase letters, numbers and hyphens
    // - At least one letter
    // - Doesn't start or end with hyphen
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Snap name"), "test-snap-name-1");

    expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
  });

  test("shows a loading state while sending", () => {
    renderComponent({ isSending: true });

    const button = screen.getByRole("button", { name: "Registering" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  test("cancel links back to the snaps list", () => {
    renderComponent();

    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/snaps",
    );
  });

  test("toggles snap name constraints", async () => {
    const user = userEvent.setup();

    renderComponent();

    expect(
      screen.queryByText("Contain no more than 40 characters"),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Show snap name constraints" }),
    );

    expect(
      screen.getByText("Contain no more than 40 characters"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Consist of only lowercase letters, numbers, and hyphens",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Contain at least one letter")).toBeInTheDocument();
    expect(
      screen.getByText("Not start or end with a hyphen"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Hide snap name constraints" }),
    );

    expect(
      screen.queryByText("Contain no more than 40 characters"),
    ).not.toBeInTheDocument();
  });

  describe("privacy", () => {
    test("is private and locked for the global store by default", () => {
      renderComponent({ stores: availableStores });

      expect(screen.getByLabelText("Store")).toHaveValue("ubuntu");
      expect(screen.getByRole("radio", { name: /private/i })).toBeChecked();
      expect(screen.getByRole("radio", { name: /public/i })).toBeDisabled();
      expect(screen.getByRole("radio", { name: /private/i })).toBeDisabled();
    });

    test("describes the privacy options", () => {
      renderComponent({ stores: availableStores });

      expect(screen.getByText("Snap privacy")).toBeVisible();
      expect(screen.getByText(/This can be changed at any time/)).toBeVisible();
      expect(
        screen.getByRole("radio", { name: /private snaps are hidden/i }),
      ).toBeVisible();
    });

    test("can be changed for other stores", async () => {
      const user = userEvent.setup();

      renderComponent({ stores: availableStores });

      await user.selectOptions(screen.getByLabelText("Store"), "test-store");

      expect(screen.getByRole("radio", { name: /public/i })).toBeEnabled();
      expect(screen.getByRole("radio", { name: /private/i })).toBeEnabled();

      await user.click(screen.getByRole("radio", { name: /public/i }));

      expect(screen.getByRole("radio", { name: /public/i })).toBeChecked();
      expect(screen.getByRole("radio", { name: /private/i })).not.toBeChecked();
    });

    test("is reset to private when switching back to the global store", async () => {
      const user = userEvent.setup();

      renderComponent({ stores: availableStores });

      await user.selectOptions(screen.getByLabelText("Store"), "test-store");
      await user.click(screen.getByRole("radio", { name: /public/i }));
      await user.selectOptions(screen.getByLabelText("Store"), "ubuntu");

      expect(screen.getByRole("radio", { name: /private/i })).toBeChecked();
      expect(screen.getByRole("radio", { name: /public/i })).toBeDisabled();
      expect(screen.getByRole("radio", { name: /private/i })).toBeDisabled();
    });
  });

  describe("submitting", () => {
    test("sends the snap name, store and CSRF token", async () => {
      const user = userEvent.setup();
      let formData: FormData | undefined;
      let csrfHeader: string | null = null;

      server.use(
        http.post("/api/register-snap", async ({ request }) => {
          csrfHeader = request.headers.get("X-CSRFToken");
          formData = await request.formData();
          return HttpResponse.json({ success: true });
        }),
      );

      const setIsSending = vi.fn();

      renderComponent({ stores: availableStores, setIsSending });

      await user.selectOptions(screen.getByLabelText("Store"), "test-store");
      await user.type(screen.getByLabelText("Snap name"), "test-snap");
      await user.click(screen.getByRole("button", { name: "Register" }));

      await waitFor(() => {
        expect(formData?.get("snap_name")).toBe("test-snap");
      });
      expect(formData?.get("store")).toBe("test-store");
      expect(formData?.get("is_private")).toBe("private");
      expect(formData?.get("csrf_token")).toBe("test-csrf-token");
      expect(csrfHeader).toBe("test-csrf-token");
      expect(setIsSending).toHaveBeenCalledWith(true);

      // Let the delayed navigation settle so it can't leak into other tests
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/snaps");
        },
        { timeout: 3000 },
      );
    });

    test("sends is_private as public when public is selected", async () => {
      const user = userEvent.setup();
      let formData: FormData | undefined;

      server.use(
        http.post("/api/register-snap", async ({ request }) => {
          formData = await request.formData();
          return HttpResponse.json({ success: true });
        }),
      );

      renderComponent({ stores: availableStores });

      await user.selectOptions(screen.getByLabelText("Store"), "test-store");
      await user.click(screen.getByRole("radio", { name: /public/i }));
      await user.type(screen.getByLabelText("Snap name"), "test-snap");
      await user.click(screen.getByRole("button", { name: "Register" }));

      await waitFor(() => {
        expect(formData?.get("is_private")).toBe("public");
      });

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/snaps");
        },
        { timeout: 3000 },
      );
    });

    test("sends is_private as private for the global store", async () => {
      const user = userEvent.setup();
      let formData: FormData | undefined;

      server.use(
        http.post("/api/register-snap", async ({ request }) => {
          formData = await request.formData();
          return HttpResponse.json({ success: true });
        }),
      );

      renderComponent({ stores: availableStores });

      await user.type(screen.getByLabelText("Snap name"), "test-snap");
      await user.click(screen.getByRole("button", { name: "Register" }));

      await waitFor(() => {
        expect(formData?.get("store")).toBe("ubuntu");
      });
      expect(formData?.get("is_private")).toBe("private");

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/snaps");
        },
        { timeout: 3000 },
      );
    });

    test("navigates to the snaps list on success", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/register-snap", () =>
          HttpResponse.json({ success: true }),
        ),
      );

      renderComponent({ stores: availableStores });

      await user.type(screen.getByLabelText("Snap name"), "test-snap");
      await user.click(screen.getByRole("button", { name: "Register" }));

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/snaps");
        },
        { timeout: 3000 },
      );
    });

    test("passes the error response up on failure", async () => {
      const user = userEvent.setup();
      const errorData = {
        error_code: "already_registered",
        snap_name: "test-snap",
        store: "ubuntu",
        is_private: false,
      };

      server.use(
        http.post("/api/register-snap", () =>
          HttpResponse.json({ success: false, data: errorData }),
        ),
      );

      const setIsSending = vi.fn();
      const setRegistrationResponse = vi.fn();

      renderComponent({
        stores: availableStores,
        setIsSending,
        setRegistrationResponse,
      });

      await user.type(screen.getByLabelText("Snap name"), "test-snap");
      await user.click(screen.getByRole("button", { name: "Register" }));

      await waitFor(
        () => {
          expect(setRegistrationResponse).toHaveBeenCalledWith(errorData);
        },
        { timeout: 3000 },
      );
      expect(setIsSending).toHaveBeenLastCalledWith(false);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
