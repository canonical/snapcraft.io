import { clearAnswers, restoreAnswers, saveAnswers } from "../saved-answers";

function renderForm() {
  document.body.innerHTML = `
    <form>
      <input name="firstName" type="text">
      <input name="email" type="email">
      <select name="country">
        <option value="">Select...</option>
        <option value="NL">Netherlands</option>
      </select>
      <textarea name="Comments_from_lead__c"></textarea>
      <input name="canonicalUpdatesOptIn" type="checkbox" value="yes">
    </form>
  `;
  return document.querySelector("form") as HTMLFormElement;
}

function fill(form: HTMLFormElement) {
  (form.elements.namedItem("firstName") as HTMLInputElement).value = "Test";
  (form.elements.namedItem("email") as HTMLInputElement).value = "a@b.com";
  (form.elements.namedItem("country") as HTMLSelectElement).value = "NL";
  (
    form.elements.namedItem("Comments_from_lead__c") as HTMLTextAreaElement
  ).value = "Hello";
  (
    form.elements.namedItem("canonicalUpdatesOptIn") as HTMLInputElement
  ).checked = true;
}

function values(form: HTMLFormElement) {
  return {
    firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
    email: (form.elements.namedItem("email") as HTMLInputElement).value,
    country: (form.elements.namedItem("country") as HTMLSelectElement).value,
    comments: (
      form.elements.namedItem("Comments_from_lead__c") as HTMLTextAreaElement
    ).value,
    optIn: (
      form.elements.namedItem("canonicalUpdatesOptIn") as HTMLInputElement
    ).checked,
  };
}

const EMPTY = {
  firstName: "",
  email: "",
  country: "",
  comments: "",
  optIn: false,
};

describe("Saved answers", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("restores the previous answers", () => {
    fill(renderForm());
    saveAnswers(document.querySelector("form") as HTMLFormElement);

    const form = renderForm();
    restoreAnswers(form);

    expect(values(form)).toEqual({
      firstName: "Test",
      email: "a@b.com",
      country: "NL",
      comments: "Hello",
      optIn: true,
    });
  });

  it("restores nothing once answers are cleared", () => {
    fill(renderForm());
    saveAnswers(document.querySelector("form") as HTMLFormElement);
    clearAnswers();

    const form = renderForm();
    restoreAnswers(form);

    expect(values(form)).toEqual(EMPTY);
  });

  it("shows an empty form when nothing was saved", () => {
    const form = renderForm();
    restoreAnswers(form);

    expect(values(form)).toEqual(EMPTY);
  });

  it("ignores saved answers that can't be read", () => {
    window.sessionStorage.setItem("contact-form-answers", "{not json");
    const form = renderForm();

    expect(() => restoreAnswers(form)).not.toThrow();
    expect(values(form)).toEqual(EMPTY);
  });

  it("continues when the browser blocks access to session storage", () => {
    const error = new DOMException("Storage blocked", "SecurityError");
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw error;
    });
    const form = renderForm();
    fill(form);

    expect(() => saveAnswers(form)).not.toThrow();
    const emptyForm = renderForm();
    expect(() => restoreAnswers(emptyForm)).not.toThrow();
    expect(values(emptyForm)).toEqual(EMPTY);
    expect(() => clearAnswers()).not.toThrow();
    expect(console.warn).toHaveBeenCalledTimes(3);
  });

  it("continues when saving answers exceeds the storage quota", () => {
    const error = new DOMException("Storage full", "QuotaExceededError");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw error;
    });
    const form = renderForm();
    fill(form);

    expect(() => saveAnswers(form)).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to save contact form answers",
      error,
    );
  });

  it("does not save or refill bot-trap fields", () => {
    document.body.innerHTML = `
      <form>
        <input name="firstName" type="text" value="Test">
        <div aria-hidden="true">
          <input name="website" type="text" value="spam">
        </div>
      </form>
    `;
    const form = document.querySelector("form") as HTMLFormElement;
    const website = form.elements.namedItem("website") as HTMLInputElement;
    saveAnswers(form);

    expect(window.sessionStorage.getItem("contact-form-answers")).not.toContain(
      "spam",
    );

    website.value = "";
    restoreAnswers(form);
    expect(website.value).toBe("");
  });
});
