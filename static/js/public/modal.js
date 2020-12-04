function toggleModal(modal) {
  if (modal && modal.classList.contains("p-modal")) {
    if (modal.style.display === "none") {
      modal.style.display = "flex";
      document.body.style.position = "fixed";
    } else {
      modal.style.display = "none";
      document.body.style.position = "relative";
    }
  }
}

function init(modalId) {
  document.addEventListener("click", (e) => {
    const targetControls = e.target.getAttribute("aria-controls");

    if (targetControls) {
      toggleModal(document.getElementById(targetControls));
    }
  });

  if (modalId) {
    const modal = document.getElementById(modalId);
    const modalBody = modal.querySelector(".p-modal__dialog");

    modal.addEventListener("click", () => {
      toggleModal(modal);
    });

    modalBody.addEventListener("click", (e) => {
      if (!e.target.getAttribute("aria-controls") === modalId) {
        e.stopPropagation();
      } else {
        toggleModal(modal);
      }
    });
  }
}

export { init };
