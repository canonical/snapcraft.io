import { buttonLoading } from "../../libs/formHelpers";
import { type Field, FIELDS, saveAnswers } from "./saved-answers";
import { fillTrackingFields } from "./tracking";

function clearError(wrapper: Element): void {
  wrapper.classList.remove("is-error");
  wrapper.querySelector(".js-validation-message")?.remove();
  const field = wrapper.querySelector<Field>(FIELDS);
  field?.removeAttribute("aria-invalid");
  field?.removeAttribute("aria-describedby");
}

function showError(field: Field): void {
  const wrapper = field.closest(".p-form-validation");
  if (!wrapper) return;
  wrapper.classList.add("is-error");
  const message = document.createElement("p");
  message.className = "p-form-validation__message js-validation-message";
  message.id = `${field.id || field.name}-error`;
  message.textContent = field.validationMessage;
  wrapper.appendChild(message);
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", message.id);
}

export function setupValidation(form: HTMLFormElement): void {
  form.noValidate = true;

  const errorWrappers = () =>
    form.querySelectorAll(".p-form-validation.is-error");

  const clearFixedErrors = () => {
    errorWrappers().forEach((wrapper) => {
      const field = wrapper.querySelector<Field>(FIELDS);
      if (field && (field.disabled || field.validity.valid)) {
        clearError(wrapper);
      }
    });
  };
  form.addEventListener("input", clearFixedErrors);
  form.addEventListener("change", clearFixedErrors);

  form.addEventListener("submit", (event) => {
    errorWrappers().forEach(clearError);

    if (!form.checkValidity()) {
      event.preventDefault();
      const invalid = Array.from(form.querySelectorAll<Field>(FIELDS)).filter(
        (field) => !field.disabled && !field.validity.valid,
      );
      invalid.forEach(showError);
      invalid[0]?.focus();
      return;
    }

    fillTrackingFields(form);
    saveAnswers(form);
    form
      .querySelectorAll<HTMLButtonElement>('[type="submit"]')
      .forEach((button) => buttonLoading(button, "Submitting…"));
  });
}
