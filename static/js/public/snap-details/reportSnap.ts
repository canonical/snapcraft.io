import "whatwg-fetch";
import { buttonEnabled, buttonLoading } from "../../libs/formHelpers";

const showEl = (el: HTMLElement) => el.classList.remove("u-hide");
const hideEl = (el: HTMLElement) => el.classList.add("u-hide");

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

function initForm(modal: HTMLElement): void {
  buttonEnabled(
    modal.querySelector("button[type=submit]") as HTMLButtonElement,
    "Submit report"
  );

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
  formURL: string
): void {
  const toggle = document.querySelector(toggleSelector) as HTMLElement;
  const modal = document.querySelector(modalSelector) as HTMLElement;
  const reportForm = modal.querySelector("form") as HTMLFormElement;

  const honeypotField = reportForm.querySelector(
    "#report-snap-confirm"
  ) as HTMLInputElement;
  const commentField = reportForm.querySelector(
    "#report-snap-comment"
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
      reportForm.querySelector("button[type=submit]") as HTMLButtonElement,
      "Submitting…"
    );

    if (
      honeypotField.checked ||
      (commentField.value && commentField.value.includes("http"))
    ) {
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
    } catch (e) {
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
