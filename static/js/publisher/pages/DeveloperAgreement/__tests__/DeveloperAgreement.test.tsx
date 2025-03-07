import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import DeveloperAgreement from "../DeveloperAgreement";

function renderComponent() {
  return render(
    <BrowserRouter>
      <DeveloperAgreement />
    </BrowserRouter>,
  );
}

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
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

describe("DeveloperAgreement", () => {
  test("'Continue' button disabled by default", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("'Continue' button enabled if agreement accepted", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(
      screen.getByLabelText("I agree to the terms and privacy notice"),
    );

    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).not.toHaveAttribute("aria-disabled");
  });

  test("Redirects to login if 500", async () => {
    const user = userEvent.setup();

    renderComponent();

    server.use(
      http.post("/account/agreement", () => {
        return new HttpResponse(null, {
          status: 500,
          statusText: "INTERNAL SERVER ERROR",
        });
      }),
    );

    await user.click(
      screen.getByLabelText("I agree to the terms and privacy notice"),
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));

    waitFor(() => {
      expect(window.location.href).toBe("/login?next=/account/agreement");
    });
  });

  test("Redirects to snaps if accepted", async () => {
    const user = userEvent.setup();

    renderComponent();

    server.use(
      http.post("/account/agreement", () => {
        return HttpResponse.json({ success: true });
      }),
    );

    await user.click(
      screen.getByLabelText("I agree to the terms and privacy notice"),
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));

    waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/snaps");
    });
  });
});
