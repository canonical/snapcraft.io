import { buttonEnabled, buttonLoading } from "../../libs/formHelpers";

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";
const SUBMIT_TEXT = "Submit report";

const showEl = (el: HTMLElement) => el.classList.remove("u-hide");
const hideEl = (el: HTMLElement) => el.classList.add("u-hide");

let turnstileScriptPromise: Promise<void> | null = null;
let turnstileSetupPromise: Promise<void> | null = null;
let turnstileWidgetId: string | number | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (!turnstileScriptPromise) {
    turnstileScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Turnstile script failed to load"));

      document.head.appendChild(script);
    }).finally(() => {
      turnstileScriptPromise = null;
    });
  }

  return turnstileScriptPromise;
}

function disableSubmitButton(button: HTMLButtonElement): void {
  buttonEnabled(button, SUBMIT_TEXT);
  button.disabled = true;
}

function resetSubmitButton(button: HTMLButtonElement): void {
  buttonEnabled(button, SUBMIT_TEXT);
}

function toggleModal(modal: HTMLElement, show?: boolean): void {
  if (typeof show === "undefined") {
    show = modal.classList.contains("u-hide");
  }

  if (show) {
    initForm(modal);
    showEl(modal);
  } else {
    hideEl(modal);
  }
}

function setupTurnstile(modal: HTMLElement): void {
  const turnstile = modal.querySelector(
    ".js-report-snap-turnstile",
  ) as HTMLElement | null;
  const submitButton = modal.querySelector(
    "button[type=submit]",
  ) as HTMLButtonElement | null;

  if (!turnstile || !submitButton) {
    return;
  }

  disableSubmitButton(submitButton);

  if (turnstileWidgetId !== null && window.turnstile) {
    window.turnstile.reset(turnstileWidgetId);
    return;
  }

  if (turnstileSetupPromise) {
    return;
  }

  turnstileSetupPromise = loadTurnstileScript()
    .then(() => {
      if (!window.turnstile) {
        return;
      }

      const sitekey = turnstile.dataset.sitekey;
      if (!sitekey) {
        return;
      }

      turnstileWidgetId = window.turnstile.render(turnstile, {
        sitekey,
        callback: () => resetSubmitButton(submitButton),
        "expired-callback": () => disableSubmitButton(submitButton),
        "error-callback": () => disableSubmitButton(submitButton),
      });
    })
    .catch(() => {
      disableSubmitButton(submitButton);
    })
    .finally(() => {
      turnstileSetupPromise = null;
    });
}

function initForm(modal: HTMLElement): void {
  const submitButton = modal.querySelector(
    "button[type=submit]",
  ) as HTMLButtonElement;
  const hasTurnstile = Boolean(
    modal.querySelector(".js-report-snap-turnstile"),
  );

  if (hasTurnstile) {
    setupTurnstile(modal);
  } else {
    resetSubmitButton(submitButton);
  }

  showEl(modal.querySelector(".js-report-snap-form") as HTMLElement);
  hideEl(modal.querySelector(".js-report-snap-success") as HTMLElement);
  hideEl(modal.querySelector(".js-report-snap-error") as HTMLElement);
}

function showSuccess(modal: HTMLElement): void {
  hideEl(modal.querySelector(".js-report-snap-form") as HTMLElement);
  showEl(modal.querySelector(".js-report-snap-success") as HTMLElement);
  hideEl(modal.querySelector(".js-report-snap-error") as HTMLElement);
}

function showError(modal: HTMLElement): void {
  hideEl(modal.querySelector(".js-report-snap-form") as HTMLElement);
  hideEl(modal.querySelector(".js-report-snap-success") as HTMLElement);
  showEl(modal.querySelector(".js-report-snap-error") as HTMLElement);
}

export default function initReportSnap(
  toggleSelector: string,
  modalSelector: string,
  formURL: string,
): void {
  const toggle = document.querySelector(toggleSelector) as HTMLElement;
  const modal = document.querySelector(modalSelector) as HTMLElement;
  const reportForm = modal.querySelector("form") as HTMLFormElement;

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    toggleModal(modal);
  });

  modal.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    if (target.closest(".js-modal-close") || target === modal) {
      toggleModal(modal);
    }
  });

  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    buttonLoading(
      reportForm.querySelector("button[type=submit]") as HTMLButtonElement,
      "Submitting…",
    );

    try {
      const resp = await fetch(formURL, {
        method: "POST",
        body: new FormData(reportForm),
      });

      if (!resp.ok) {
        showError(modal);
        return;
      }

      if (reportForm.action.endsWith("/report")) {
        const data = await resp.json();
        if (!data.ok) {
          showError(modal);
          return;
        }
      }

      showSuccess(modal);
    } catch (_) {
      showError(modal);
    }
  });

  // close modal on ESC
  window.addEventListener("keyup", (event) => {
    if (event.keyCode === 27) {
      toggleModal(modal, false);
    }
  });
}
