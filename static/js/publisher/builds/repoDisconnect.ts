function initRepoDisconnect() {
  /**
  Toggles visibility of modal dialog.
  @param {HTMLElement} modal Modal dialog to show or hide.
*/
  function toggleModal(modal: HTMLElement) {
    if (modal && modal.classList.contains("p-modal")) {
      if (modal.style.display === "none") {
        modal.style.display = "flex";
      } else {
        modal.style.display = "none";
      }
    }
  }

  const repoDisconnectButtons = document.querySelectorAll(
    "[aria-controls='repo-disconnect-modal']",
  ) as NodeList;
  const repoDisconnectConfirm = document.querySelector(
    "[data-js='repo-disconnect-confirm']",
  ) as HTMLButtonElement;
  const repoDisconnectModal = document.querySelector(
    "[data-js='repo-disconnect-modal']",
  ) as HTMLElement;
  const repoDisconnectForm = document.getElementById(
    "repoDisconnectForm",
  ) as HTMLElement;

  if (
    repoDisconnectButtons &&
    repoDisconnectModal &&
    repoDisconnectConfirm &&
    repoDisconnectForm
  ) {
    // Add click handler for clicks on elements with aria-controls for repo-disconnect-modal
    [].slice.call(repoDisconnectButtons).forEach((el: HTMLElement) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        toggleModal(repoDisconnectModal);
      });
    });

    repoDisconnectForm.addEventListener("submit", () => {
      repoDisconnectConfirm.disabled = true;
    });
  }
}

export { initRepoDisconnect };
