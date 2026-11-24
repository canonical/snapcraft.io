import { setupContactForm } from "./contact-form";
import { clearAnswers, restoreAnswers } from "./contact-form/saved-answers";
import {
  clearTracking,
  currentURLWithoutTracking,
  pushEvent,
} from "./contact-form/tracking";

const modal = document.getElementById("contact-form-modal") as
  | HTMLElement
  | undefined;
const modalBody = document.getElementById("modal-body") as
  | HTMLElement
  | undefined;
const successPanel = modal?.querySelector<HTMLElement>(".js-contact-success");
const errorPanel = modal?.querySelector<HTMLElement>(".js-contact-error");
const dialog = modal?.querySelector<HTMLElement>('[role="dialog"]');
const TRIGGER = "[data-js='contact-form-trigger']";
let trigger = document.querySelector<HTMLElement>(TRIGGER);

function showPanel(panel: "form" | "success" | "error"): void {
  if (modalBody) modalBody.hidden = panel !== "form";
  if (successPanel) successPanel.hidden = panel !== "success";
  if (errorPanel) errorPanel.hidden = panel !== "error";
  modal?.classList.remove("u-hide");
  dialog?.focus();
}

function closeModal(): void {
  modal?.classList.add("u-hide");
  trigger?.focus();
}

function trapTabFocus(event: KeyboardEvent, container: HTMLElement): void {
  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(
      "a[href], button, input, select, textarea, [tabindex]",
    ),
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      element.getClientRects().length > 0,
  );
  const index = focusable.findIndex(
    (element) => element === document.activeElement,
  );
  if (
    index === -1 ||
    (event.shiftKey && index === 0) ||
    (!event.shiftKey && index === focusable.length - 1)
  ) {
    event.preventDefault();
    const target = event.shiftKey
      ? focusable[focusable.length - 1]
      : focusable[0];
    (target ?? container).focus();
  }
}

if (modal) {
  modal.querySelector(".p-modal__close")?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (modal.classList.contains("u-hide")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    } else if (event.key === "Tab" && dialog) {
      trapTabFocus(event, dialog);
    }
  });
}

function renderForm(args: DOMStringMap): HTMLFormElement | null {
  const formEl = document.getElementById(
    "contactFormTemplate",
  ) as HTMLFormElement;

  let formTemplate = formEl.innerText;

  Object.keys(args).forEach((arg: string) => {
    formTemplate = formTemplate.split(`{{${arg}}}`).join(`${args[arg]}`);
  });

  if (!modalBody) return null;
  modalBody.innerHTML = formTemplate;
  const form = modalBody.querySelector<HTMLFormElement>(".js-contact-form");
  if (!form) return null;

  setupContactForm(form);
  // Runs after validation, which cancels invalid submits
  form.addEventListener("submit", (submitEvent) => {
    if (submitEvent.defaultPrevented) return;
    const returnURL = form.elements.namedItem("returnURL");
    if (returnURL instanceof HTMLInputElement) {
      const url = currentURLWithoutTracking();
      url.hash = "contact-form-success";
      returnURL.value = url.href;
    }
    pushEvent("contact_form_submitted");
  });
  return form;
}

function openContactForm(link: HTMLElement): void {
  trigger = link;
  renderForm(link.dataset);
  showPanel("form");
  pushEvent("contact_form_opened");
}

if (modal) {
  // Delegated so links rendered later (e.g. by React) also open the pop-up
  document.addEventListener("click", (event) => {
    const link = (event.target as Element | null)?.closest<HTMLElement>(
      TRIGGER,
    );
    if (!link) return;
    event.preventDefault();
    openContactForm(link);
  });

  modal
    .querySelector(".js-contact-try-again")
    ?.addEventListener("click", () => {
      const form = renderForm({});
      if (form) restoreAnswers(form);
      showPanel("form");
    });

  if (window.location.hash === "#contact-form-success") {
    clearAnswers();
    clearTracking();
    showPanel("success");
    pushEvent("contact_form_success");
  } else if (window.location.hash === "#contact-form-fail") {
    showPanel("error");
    pushEvent("contact_form_failed");
  }
}
