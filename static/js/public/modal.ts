function toggleModal(modal: HTMLElement) {
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

function init(): void {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const modalId = target.getAttribute("aria-controls") as string;
    const modal = document.getElementById(modalId) as HTMLElement;

    if (Object.keys(target.dataset).includes("jsToggleModal")) {
      toggleModal(modal);
    }

    if (target.classList.contains("p-modal")) {
      toggleModal(target);
    }
  });
}

export { init };
