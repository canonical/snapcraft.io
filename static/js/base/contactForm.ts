const contactFormTriggers = document.querySelectorAll(
  "[data-js='contact-form-trigger']",
) as NodeListOf<Element>;

const modal = document.getElementById("contact-form-modal") as HTMLElement;
const modalBody = document.getElementById("modal-body") as HTMLElement;

if (modal) {
  const closeModal = modal.querySelector(".p-modal__close");
  if (closeModal) {
    closeModal.addEventListener("click", () => modal.classList.add("u-hide"));
  }
}

function handleClick(event: Event): void {
  event.preventDefault();

  const target = event.target as HTMLElement;
  const args = target.dataset;

  const formEl = document.getElementById(
    "contactFormTemplate",
  ) as HTMLFormElement;

  let formTemplate = formEl.innerText;

  Object.keys(args).forEach((arg) => {
    formTemplate = formTemplate.split(`{{${arg}}}`).join(`${args[arg]}`);
  });

  modalBody.innerHTML = formTemplate;
  modal.classList.remove("u-hide");
}

function attachClickHandler(element: Element): void {
  element.addEventListener("click", handleClick);
}

contactFormTriggers.forEach(attachClickHandler);
