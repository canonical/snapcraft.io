const contactFormTriggers = document.querySelectorAll(
  "[data-js='contact-form-trigger']",
) as NodeListOf<Element>;

const modal = document.getElementById("contact-form-modal") as
  | HTMLElement
  | undefined;
const modalBody = document.getElementById("modal-body") as
  | HTMLElement
  | undefined;

if (modal) {
  const closeModal = modal.querySelector(".p-modal__close");
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      modal.classList.add("u-hide");
    });
  }
}

function handleClick(event: Event): void {
  event.preventDefault();

  const target = event.currentTarget as HTMLElement;
  const args = target.dataset;

  const formTemplateEl = document.getElementById(
    "contactFormTemplate",
  ) as HTMLScriptElement;

  if (!formTemplateEl) return;

  let formTemplate = formTemplateEl.textContent || "";

  Object.keys(args).forEach((key) => {
    const value = args[key] ?? "";
    formTemplate = formTemplate.split(`{{${key}}}`).join(escapeHTML(value));
  });

  const tempContainer = document.createElement("template");
  tempContainer.innerHTML = formTemplate.trim();

  modalBody?.replaceChildren(tempContainer.content);

  modal?.classList.remove("u-hide");
}

// Escapes HTML to prevent XSS by encoding special characters.
function escapeHTML(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function attachClickHandler(element: Element): void {
  element.addEventListener("click", handleClick);
}

contactFormTriggers.forEach(attachClickHandler);
