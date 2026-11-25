import { readJSON, remove, writeJSON } from "./storage";

const STORAGE_KEY = "contact-form-answers";
const LABEL = "contact form answers";
// Bot traps are visible inputs but never typed by real users
const SKIP = new Set(["website", "name"]);

export type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export const FIELDS = "input, select, textarea";

function userFields(form: HTMLFormElement): Field[] {
  return Array.from(form.querySelectorAll<Field>(FIELDS)).filter(
    (field) => field.name && field.type !== "hidden" && !SKIP.has(field.name),
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
  writeJSON(STORAGE_KEY, LABEL, answers);
}

export function restoreAnswers(form: HTMLFormElement): void {
  const answers = readJSON(STORAGE_KEY, LABEL);
  userFields(form).forEach((field) => {
    const value = answers[field.name];
    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      if (typeof value === "boolean") field.checked = value;
    } else if (typeof value === "string") {
      field.value = value;
      field.dispatchEvent(new Event("change"));
    }
  });
}

export function clearAnswers(): void {
  remove(STORAGE_KEY, LABEL);
}
