const STORAGE_KEY = "contact-form-answers";
// Bot traps are visible inputs but never typed by real users
const SKIP = new Set(["website", "name"]);

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function userFields(form: HTMLFormElement): Field[] {
  return Array.from(
    form.querySelectorAll<Field>("input[name], select[name], textarea[name]"),
  ).filter((field) => field.type !== "hidden" && !SKIP.has(field.name));
}

export function saveAnswers(form: HTMLFormElement): void {
  const answers: Record<string, string | boolean> = {};
  userFields(form).forEach((field) => {
    answers[field.name] =
      field instanceof HTMLInputElement && field.type === "checkbox"
        ? field.checked
        : field.value;
  });
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (error) {
    console.warn("Failed to save contact form answers", error);
  }
}

export function restoreAnswers(form: HTMLFormElement): void {
  let answers: Record<string, unknown>;
  try {
    answers = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch (error) {
    console.warn("Failed to read contact form answers", error);
    return;
  }
  if (!answers || typeof answers !== "object") return;

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
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to remove contact form answers", error);
  }
}
