import "whatwg-fetch";
import { buttonEnabled, buttonLoading } from "../../libs/formHelpers";

const showEl = el => el.classList.remove("u-hide");
const hideEl = el => el.classList.add("u-hide");

function toggleModal(modal, show) {
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

function initForm(modal) {
  buttonEnabled(modal.querySelector("button[type=submit]"), "Submit report");

  showEl(modal.querySelector(".js-report-snap-form"));
  hideEl(modal.querySelector(".js-report-snap-success"));
  hideEl(modal.querySelector(".js-report-snap-error"));
}

function showSuccess(modal) {
  hideEl(modal.querySelector(".js-report-snap-form"));
  showEl(modal.querySelector(".js-report-snap-success"));
  hideEl(modal.querySelector(".js-report-snap-error"));
}

function showError(modal) {
  hideEl(modal.querySelector(".js-report-snap-form"));
  hideEl(modal.querySelector(".js-report-snap-success"));
  showEl(modal.querySelector(".js-report-snap-error"));
}

export default function initReportSnap(
  snapName,
  toggleSelector,
  modalSelector,
  formURL
) {
  const toggle = document.querySelector(toggleSelector);
  const modal = document.querySelector(modalSelector);
  const reportForm = modal.querySelector("form");

  toggle.addEventListener("click", event => {
    event.preventDefault();
    toggleModal(modal);
  });

  modal.addEventListener("click", event => {
    const target = event.target;

    if (target.closest(".js-modal-close") || target === modal) {
      toggleModal(modal);
    }
  });

  reportForm.addEventListener("submit", e => {
    e.preventDefault();
    buttonLoading(
      reportForm.querySelector("button[type=submit]"),
      "Submitting…"
    );

    fetch(formURL, {
      method: "POST",
      body: new FormData(reportForm),
      mode: "no-cors"
    })
      .then(() => showSuccess(modal))
      .catch(() => showError(modal));
  });

  // close modal on ESC
  window.addEventListener("keyup", event => {
    if (event.keyCode === 27) {
      toggleModal(modal, false);
    }
  });
}
