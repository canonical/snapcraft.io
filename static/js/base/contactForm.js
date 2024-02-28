const contactFormTriggers = document.querySelectorAll(
  "[data-js='contact-form-trigger']",
);

const modal = document.getElementById("contact-form-modal");
const modalBody = document.getElementById("modal-body");

if (modal) {
  const closeModal = modal.querySelector(".p-modal__close");
  if (closeModal) {
    closeModal.addEventListener("click", () => modal.classList.add("u-hide"));
  }
}

function handleClick(event) {
  event.preventDefault();

  const args = event.target.dataset;
  let formTemplate = document.getElementById("contactFormTemplate").innerText;

  Object.keys(args).forEach((arg) => {
    formTemplate = formTemplate.split(`{{${arg}}}`).join(`${args[arg]}`);
  });

  modalBody.innerHTML = formTemplate;
  modal.classList.remove("u-hide");
}

function attachClickHandler(element) {
  element.addEventListener("click", handleClick);
}

contactFormTriggers.forEach(attachClickHandler);
