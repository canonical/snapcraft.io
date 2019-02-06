import "whatwg-fetch";

function toggleModal(modal, show) {
  if (typeof show === "undefined") {
    show = modal.style.display === "none";
  }

  if (show) {
    showForm(modal);
    modal.style.display = "";
  } else {
    modal.style.display = "none";
  }
}

function showForm(modal) {
  buttonEnabled(modal.querySelector("button[type=submit]"));

  modal.querySelector(".js-report-snap-form").style.display = "";
  modal.querySelector(".js-report-snap-success").style.display = "none";
  modal.querySelector(".js-report-snap-error").style.display = "none";
}

function showSuccess(modal) {
  modal.querySelector(".js-report-snap-form").style.display = "none";
  modal.querySelector(".js-report-snap-success").style.display = "";
  modal.querySelector(".js-report-snap-error").style.display = "none";
}

function showError(modal) {
  modal.querySelector(".js-report-snap-form").style.display = "none";
  modal.querySelector(".js-report-snap-success").style.display = "none";
  modal.querySelector(".js-report-snap-error").style.display = "";
}

function buttonLoading(button) {
  button.disabled = true;
  button.innerHTML =
    "<i class='p-icon--spinner u-animation--spin'></i> Submitting…";
}

function buttonEnabled(button) {
  button.disabled = false;
  button.innerHTML = "Submit report";
}

export default function initReportSnap(
  snapName,
  toggleSelector,
  modalSelector
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
    buttonLoading(reportForm.querySelector("button[type=submit]"));

    fetch(`/${snapName}/report`, {
      method: "POST",
      body: new FormData(reportForm)
    })
      .then(response => response.json())
      .then(json => {
        if (json.success) {
          showSuccess(modal);
        } else {
          showError(modal);
        }
      })
      .catch(() => showError(modal));
  });

  // close modal on ESC
  window.addEventListener("keyup", event => {
    if (event.keyCode === 27) {
      toggleModal(modal, false);
    }
  });
}
