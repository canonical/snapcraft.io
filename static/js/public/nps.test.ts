import { vi } from "vitest";

import nps from "./nps";

type MktoFormMock = {
  onSuccess: ReturnType<typeof vi.fn>;
  setValues: ReturnType<typeof vi.fn>;
  submit: ReturnType<typeof vi.fn>;
};

type MktoFormsWindow = Window & {
  MktoForms2?: {
    loadForm: ReturnType<typeof vi.fn>;
  };
};

describe("nps", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    delete (window as MktoFormsWindow).MktoForms2;
    vi.restoreAllMocks();
  });

  function setupForm() {
    document.body.innerHTML = `
      <a class="js-nps-comment-toggle" href="#">Leave a comment</a>
      <div class="js-nps-comment u-hide">
        <form>
          <input name="comment" value="Great snap" />
          <button type="submit">Submit</button>
        </form>
      </div>
    `;
  }

  function setupMktoFormsMock() {
    let successCallback: (() => boolean) | undefined;
    const mktoForm = {
      onSuccess: vi.fn((callback: () => boolean) => {
        successCallback = callback;
      }),
      setValues: vi.fn(),
      submit: vi.fn(),
    };
    const loadForm = vi.fn(
      (
        _host: string,
        _accountId: string,
        _formId: number,
        callback: (mktoForm: MktoFormMock) => void,
      ) => {
        callback(mktoForm);
      },
    );

    Object.defineProperty(window, "MktoForms2", {
      value: { loadForm },
      configurable: true,
    });

    return {
      loadForm,
      mktoForm,
      getSuccessCallback: () => successCallback,
    };
  }

  test("hides the comment toggle when Marketo forms are unavailable", () => {
    setupForm();

    nps();

    expect(
      document
        .querySelector<HTMLElement>(".js-nps-comment-toggle")!
        .classList.contains("u-hide"),
    ).toBe(true);
  });

  test("loads the Marketo form and toggles the comment field", () => {
    setupForm();
    const { loadForm } = setupMktoFormsMock();

    nps();

    expect(loadForm).toHaveBeenCalledWith(
      "//app-sjg.marketo.com",
      "066-EOV-335",
      3308,
      expect.any(Function),
    );

    const commentHolder =
      document.querySelector<HTMLElement>(".js-nps-comment")!;
    document
      .querySelector<HTMLAnchorElement>(".js-nps-comment-toggle")!
      .click();

    expect(commentHolder.classList.contains("u-hide")).toBe(false);
  });

  test("syncs values and submits through the Marketo form", () => {
    setupForm();
    const { mktoForm } = setupMktoFormsMock();

    nps();

    const input = document.querySelector<HTMLInputElement>("input")!;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(mktoForm.setValues).toHaveBeenCalledWith({
      comment: "Great snap",
    });

    document
      .querySelector<HTMLFormElement>(".js-nps-comment form")!
      .requestSubmit();

    expect(
      document.querySelector<HTMLButtonElement>(".js-nps-comment button")!
        .innerHTML,
    ).toBe(`<i class="p-icon--spinner u-animation--spin"></i>`);
    expect(mktoForm.submit).toHaveBeenCalledTimes(1);
  });

  test("hides the comment field after a successful Marketo submit", () => {
    setupForm();
    const { getSuccessCallback } = setupMktoFormsMock();

    nps();

    const callbackResult = getSuccessCallback()!();

    expect(callbackResult).toBe(false);
    expect(
      document
        .querySelector<HTMLElement>(".js-nps-comment")!
        .classList.contains("u-hide"),
    ).toBe(true);
    expect(
      document
        .querySelector<HTMLElement>(".js-nps-comment-toggle")!
        .classList.contains("u-hide"),
    ).toBe(true);
  });
});
