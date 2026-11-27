import { readJSON, removeItem, writeJSON } from "./storage";

const STORAGE_KEY = "contact-form-answers";
const LABEL = "contact form answers";

export type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function userFields(form: HTMLFormElement): Field[] {
  return Array.from(
    form.querySelectorAll<Field>("input[name], select[name], textarea[name]"),
  ).filter(
    // Bot traps live in an aria-hidden wrapper and are never typed by real users
    (field) =>
      field.type !== "hidden" && !field.closest('[aria-hidden="true"]'),
  );
}

export function saveAnswers(form: HTMLFormElement): void {
  const answers: Record<string, string | boolean> = {};
  userFields(form).forEach((field) => {
    answers[field.name] =
      field instanceof HTMLInputElement && field.type === "checkbox"
        ? field.checked
        : field.value;
  });
  writeJSON(STORAGE_KEY, answers, LABEL);
}

export function restoreAnswers(form: HTMLFormElement): void {
  const answers = readJSON(STORAGE_KEY, LABEL);
  userFields(form).forEach((field) => {
    const value = answers[field.name];
    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      if (typeof value === "boolean") field.checked = value;
    } else if (typeof value === "string") {
      field.value = value;
    }
  });
}

export function clearAnswers(): void {
  removeItem(STORAGE_KEY, LABEL);
}
