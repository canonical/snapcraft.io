import { initEmbeddedCardPicker } from "./publicise";

const showEl = (el: { classList: { remove: (arg0: string) => void } }) =>
  el.classList.remove("u-hide");
const hideEl = (el: { classList: { add: (arg0: string) => void } }) =>
  el.classList.add("u-hide");

function toggleModal(
  modal: HTMLElement,
  show?: boolean | undefined,
  initCallback?: { (): void; (): void } | undefined,
) {
  if (typeof show === "undefined") {
    show = modal.classList.contains("u-hide");
  }

  if (show) {
    if (initCallback) {
      initCallback();
    }
    showEl(modal);
    document.body.style.overflow = "hidden";
  } else {
    hideEl(modal);
    document.body.style.overflow = "";
  }
}

export default function initEmbeddedCardModal(snapName: string): void {
  const toggle = document.querySelector(
    ".js-embedded-card-toggle",
  ) as HTMLElement;
  const modal = document.querySelector("#embedded-card-modal") as HTMLElement;
  const dialog = modal.querySelector(
    "#embedded-card-modal-dialog",
  ) as HTMLElement;
  const previewFrame = modal.querySelector("#embedded-card-frame");
  const codeElement = modal.querySelector("#snippet-card-html");
  const buttonRadios = modal.querySelectorAll("input[name=store-button]");
  const optionButtons = modal.querySelectorAll("input[type=checkbox]");

  function updateHeightCallback() {
    // adjust the height of the modal to size of the frame
    dialog.style.minHeight = "";

    setTimeout(() => {
      dialog.style.minHeight = `${dialog.clientHeight}px`;
    }, 1);
  }

  function initFrame() {
    renderCard();
  }

  const renderCard = initEmbeddedCardPicker({
    snapName,
    previewFrame,
    codeElement,
    buttonRadios,
    optionButtons,
    updateHeightCallback,
  });

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    toggleModal(modal, true, initFrame);
  });

  modal.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    if (target.closest(".js-modal-close") || target === modal) {
      toggleModal(modal);
    }
  });
}
