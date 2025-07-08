import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
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
      <RecoilRoot>
        <JotaiTestProvider initialValues={[[brandStoresState, storesResponse]]}>
          <RequestReservedName />
        </JotaiTestProvider>
      </RecoilRoot>
    </BrowserRouter>,
  );
}

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useSearchParams: () => [
      new URLSearchParams({
        snap_name: testSnapName,
        store: testStoreName,
      }),
    ],
  };
});

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

  test("CTA button is disabled by default", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: "Yes, I am sure" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  test("CTA button is enabled if comment is present", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Comment"), "This is a test comment");

    expect(
      screen.getByRole("button", { name: "Yes, I am sure" }),
    ).not.toHaveAttribute("aria-disabled");
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
