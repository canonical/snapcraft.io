import { initEmbeddedCardPicker } from "../../publisher/publicise";

const showEl = el => el.classList.remove("u-hide");
const hideEl = el => el.classList.add("u-hide");

function toggleModal(modal, show, initCallback) {
  if (typeof show === "undefined") {
    show = modal.classList.contains("u-hide");
  }

  if (show) {
    if (initCallback) {
      initCallback();
    }
    showEl(modal);
  } else {
    hideEl(modal);
  }
}

export default function initEmbeddedCardModal(snapName) {
  const toggle = document.querySelector(".js-embedded-card-toggle");
  const modal = document.querySelector("#embedded-card-modal");
  const dialog = modal.querySelector("#embedded-card-modal-dialog");
  const previewFrame = modal.querySelector("#embedded-card-frame");
  const codeElement = modal.querySelector("#snippet-card-html");
  const buttonRadios = modal.querySelectorAll("input[name=store-button]");
  const optionButtons = modal.querySelectorAll("input[type=checkbox]");
  const previewTab = modal.querySelector(
    "[aria-controls='embedded-card-modal-preview']"
  );
  const previewTabContent = modal.querySelector("#embedded-card-modal-preview");
  const htmlTab = modal.querySelector(
    "[aria-controls='embedded-card-modal-html']"
  );
  const htmlTabContent = modal.querySelector("#embedded-card-modal-html");

  function updateHeightCallback() {
    // adjust the height of the modal to size of the frame
    dialog.style.minHeight = "";

    setTimeout(() => {
      dialog.style.minHeight = dialog.clientHeight + "px";
    }, 1);
  }

  function showPreviewTab() {
    hideEl(htmlTabContent);
    showEl(previewTabContent);
    htmlTab.setAttribute("aria-selected", "false");
    previewTab.setAttribute("aria-selected", "true");
    // re-render preview to make sure height is updated
    renderCard();
  }

  function showHtmlTab() {
    hideEl(previewTabContent);
    showEl(htmlTabContent);
    previewTab.setAttribute("aria-selected", "false");
    htmlTab.setAttribute("aria-selected", "true");
  }

  function initFrame() {
    showPreviewTab();
  }

  const renderCard = initEmbeddedCardPicker({
    snapName,
    previewFrame,
    codeElement,
    buttonRadios,
    optionButtons,
    updateHeightCallback
  });

  toggle.addEventListener("click", event => {
    event.preventDefault();
    toggleModal(modal, true, initFrame);
  });

  modal.addEventListener("click", event => {
    const target = event.target;

    if (target.closest(".js-modal-close") || target === modal) {
      toggleModal(modal);
    }
  });

  previewTab.addEventListener("click", e => {
    e.preventDefault();
    showPreviewTab();
  });

  htmlTab.addEventListener("click", e => {
    e.preventDefault();
    showHtmlTab();
  });
}
