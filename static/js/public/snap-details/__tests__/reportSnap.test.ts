import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

// @ts-expect-error importing the HTML template as a string
import REPORT_SNAP_MODAL from "../../../../../templates/store/snap-details/_report_snap_modal.html?raw";

const TOGGLE_SELECTOR = ".js-modal-open";
const MODAL_SELECTOR = "#report-snap-modal";
const FORM_URL = "/report";

describe("report snap modal", () => {
  let initReportSnap: typeof import("../reportSnap").default;

  beforeEach(async () => {
    vi.resetModules();
    ({ default: initReportSnap } = await import("../reportSnap"));
    document.body.innerHTML = `
      <a class="js-modal-open" href="#report-snap-modal">Report this Snap</a>
      ${REPORT_SNAP_MODAL}
    `;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    delete window.turnstile;
  });

  function setupTurnstileMock() {
    const render = vi.fn(() => 42);
    const reset = vi.fn();

    const appendSpy = vi
      .spyOn(document.head, "appendChild")
      .mockImplementation((node: Node) => {
        if (node instanceof HTMLScriptElement) {
          Object.defineProperty(window, "turnstile", {
            value: { render, reset },
            configurable: true,
          });
          node.onload?.(new Event("load"));
        }

        return node;
      });

    return { appendSpy, render, reset };
  }

  test("loads Turnstile only when the modal opens", async () => {
    const user = userEvent.setup();
    const { appendSpy, render } = setupTurnstileMock();

    initReportSnap(TOGGLE_SELECTOR, MODAL_SELECTOR, FORM_URL);

    expect(appendSpy).not.toHaveBeenCalled();

    await user.click(
      document.querySelector<HTMLAnchorElement>(TOGGLE_SELECTOR)!,
    );

    await waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect((appendSpy.mock.calls[0][0] as HTMLScriptElement).src).toContain(
      "https://challenges.cloudflare.com/turnstile/v0/api.js",
    );
  });

  test("keeps submit disabled until Turnstile verifies", async () => {
    const user = userEvent.setup();
    const { render, reset } = setupTurnstileMock();

    initReportSnap(TOGGLE_SELECTOR, MODAL_SELECTOR, FORM_URL);

    await user.click(
      document.querySelector<HTMLAnchorElement>(TOGGLE_SELECTOR)!,
    );
    await waitFor(() => expect(render).toHaveBeenCalledTimes(1));

    const submitButton = document.querySelector<HTMLButtonElement>(
      "#report-snap-modal button[type=submit]",
    )!;
    const [, options] = render.mock.calls[0];

    expect(submitButton).toBeDisabled();

    options.callback();
    expect(submitButton).not.toBeDisabled();

    options["expired-callback"]();
    expect(submitButton).toBeDisabled();

    await user.click(
      document.querySelector<HTMLButtonElement>(
        "#report-snap-modal .js-modal-close",
      )!,
    );
    await user.click(
      document.querySelector<HTMLAnchorElement>(TOGGLE_SELECTOR)!,
    );

    expect(reset).toHaveBeenCalledWith(42);
    expect(submitButton).toBeDisabled();
  });

  test("restores the submit label when reopening after loading", async () => {
    const user = userEvent.setup();
    setupTurnstileMock();

    initReportSnap(TOGGLE_SELECTOR, MODAL_SELECTOR, FORM_URL);

    const submitButton = document.querySelector<HTMLButtonElement>(
      "#report-snap-modal button[type=submit]",
    )!;
    submitButton.disabled = true;
    submitButton.innerHTML = "Submitting…";

    await user.click(
      document.querySelector<HTMLAnchorElement>(TOGGLE_SELECTOR)!,
    );

    expect(submitButton).toHaveTextContent("Submit report");
    expect(submitButton).toBeDisabled();
  });
});
