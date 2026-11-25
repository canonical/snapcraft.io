import { setupContactForm } from "./contact-form";
import { setupFullPageResult } from "./contact-form/full-page";
import { contactFormFailed, contactFormSucceeded } from "./contact-form/result";
import { restoreAnswers } from "./contact-form/saved-answers";
import {
  captureLanding,
  currentURLWithoutTracking,
  trackFormEvent,
} from "./contact-form/tracking";

captureLanding();
document
  .querySelectorAll<HTMLFormElement>(".js-contact-form")
  .forEach(setupContactForm);
setupFullPageResult();

const modal = document.getElementById("contact-form-modal");
const modalBody = document.getElementById("modal-body");
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

function renderForm(): void {
  const template = document.getElementById("contactFormTemplate");
  if (!(template instanceof HTMLTemplateElement) || !modalBody) return;

  modalBody.replaceChildren(template.content.cloneNode(true));
  const form = modalBody.querySelector<HTMLFormElement>(".js-contact-form");
  if (!form) return;

  setupContactForm(form);
  restoreAnswers(form);
  // Runs after validation, which cancels invalid submits
  form.addEventListener("submit", (submitEvent) => {
    if (submitEvent.defaultPrevented) return;
    const returnURL = form.elements.namedItem("returnURL");
    if (returnURL instanceof HTMLInputElement) {
      const url = currentURLWithoutTracking();
      url.hash = "contact-form-success";
      returnURL.value = url.href;
    }
    trackFormEvent("contact_form_submitted");
  });
}

function openContactForm(link: HTMLElement): void {
  trigger = link;
  renderForm();
  showPanel("form");
  trackFormEvent("contact_form_opened");
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
      renderForm();
      showPanel("form");
    });

  if (window.location.hash === "#contact-form-success") {
    showPanel("success");
    contactFormSucceeded();
  } else if (window.location.hash === "#contact-form-fail") {
    showPanel("error");
    contactFormFailed();
  }
}
