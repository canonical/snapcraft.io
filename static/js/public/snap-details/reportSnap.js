import "whatwg-fetch";

function toggleModal(modal) {
  if (modal.style.display === "none") {
    modal.style.display = "";
  } else {
    modal.style.display = "none";
    showForm(modal);
  }
}

function showForm(modal) {
  modal.querySelector("button[type=submit]").disabled = false;
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

    if (target.closest(".js-modal-close")) {
      toggleModal(modal);
    }
  });

  reportForm.addEventListener("submit", e => {
    e.preventDefault();
    reportForm.querySelector("button[type=submit]").disabled = true;
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
}
