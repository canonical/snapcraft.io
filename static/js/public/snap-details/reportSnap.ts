import "whatwg-fetch";
import { buttonEnabled, buttonLoading } from "../../libs/formHelpers";

const showEl = (el: HTMLElement): void => {
  el.classList.remove("u-hide");
};

const hideEl = (el: HTMLElement): void => {
  el.classList.add("u-hide");
};

function initForm(modal: HTMLElement): void {
  buttonEnabled(modal.querySelector("button[type=submit]")!, "Submit report");

  showEl(modal.querySelector(".js-report-snap-form")!);
  hideEl(modal.querySelector(".js-report-snap-success")!);
  hideEl(modal.querySelector(".js-report-snap-error")!);
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

function showSuccess(modal: HTMLElement): void {
  hideEl(modal.querySelector(".js-report-snap-form")!);
  showEl(modal.querySelector(".js-report-snap-success")!);
  hideEl(modal.querySelector(".js-report-snap-error")!);
}

function showError(modal: HTMLElement): void {
  hideEl(modal.querySelector(".js-report-snap-form")!);
  hideEl(modal.querySelector(".js-report-snap-success")!);
  showEl(modal.querySelector(".js-report-snap-error")!);
}

export default function initReportSnap(
  toggleSelector: string,
  modalSelector: string,
  formURL: string,
): void {
  const toggle = document.querySelector(toggleSelector) as HTMLElement;
  const modal = document.querySelector(modalSelector) as HTMLElement;
  const reportForm = modal.querySelector("form") as HTMLFormElement;

  const honeypotField = reportForm.querySelector(
    "#report-snap-confirm",
  ) as HTMLInputElement;
  const commentField = reportForm.querySelector(
    "#report-snap-comment",
  ) as HTMLInputElement;

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
      reportForm.querySelector("button[type=submit]")!,
      "Submitting…",
    );

    if (honeypotField.checked || commentField?.value?.includes("http")) {
      showSuccess(modal);
      return;
    }

    try {
      const resp = await fetch(formURL, {
        method: "POST",
        body: new FormData(reportForm),
        mode: "no-cors",
      });

      if (reportForm.action.endsWith("/report")) {
        const data = await resp.json();
        if (data.url) {
          const formData = new FormData(reportForm);
          fetch(data.url, {
            method: "POST",
            body: formData,
            mode: "no-cors",
          });
        }
      }

      showSuccess(modal);
    } catch (_) {
      showError(modal);
    }
  });

  // close modal on ESC
  window.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
      toggleModal(modal, false);
    }
  });
}
