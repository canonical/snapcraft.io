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

function init() {
  document.addEventListener("click", (e) => {
    const target = e.target;
    const modalId = target.getAttribute("aria-controls");
    const modal = document.getElementById(modalId);

    if (Object.keys(target.dataset).includes("jsToggleModal")) {
      toggleModal(modal);
    }

    if (target.classList.contains("p-modal")) {
      toggleModal(target);
    }
  });
}

export { init };
