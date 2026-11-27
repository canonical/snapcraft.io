import { trackEvent } from "@canonical/analytics-events";
import { setupValidation } from "../validation";

vi.mock("@canonical/analytics-events", () => ({ trackEvent: vi.fn() }));

function renderForm(beforeSend?: () => void) {
  document.body.innerHTML = `
    <form>
      <div class="p-form-validation">
        <input id="firstName" name="firstName" required>
      </div>
      <div class="p-form-validation">
        <input id="email" name="email" type="email" required>
      </div>
      <div class="p-form-validation">
        <input id="phone" name="phone" type="tel">
      </div>
      <button type="submit">Submit</button>
    </form>
  `;
  const form = document.querySelector("form") as HTMLFormElement;
  setupValidation(form, beforeSend);
  return form;
}

function submitForm(form: HTMLFormElement): Event {
  const event = new Event("submit", { cancelable: true });
  form.dispatchEvent(event);
  return event;
}

function type(id: string, value: string) {
  const field = document.getElementById(id) as HTMLInputElement;
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

function submitValid(form: HTMLFormElement): Event {
  type("firstName", "Ada");
  type("email", "ada@example.com");
  return submitForm(form);
}

const wrapper = (id: string) =>
  document.getElementById(id)?.closest(".p-form-validation") as HTMLElement;

describe("Form validation", () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  it("cancels the submit and marks each empty required field", () => {
    const submit = submitForm(renderForm());

    expect(submit.defaultPrevented).toBe(true);
    expect(wrapper("firstName").classList).toContain("is-error");
    expect(wrapper("email").classList).toContain("is-error");
    expect(wrapper("phone").classList).not.toContain("is-error");
    expect(document.activeElement?.id).toBe("firstName");
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("records a valid submit and runs the before-send step", () => {
    const beforeSend = vi.fn();
    const form = renderForm(beforeSend);
    submitValid(form);

    expect(beforeSend).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("contact_form_submitted");
  });

  it("lets a valid form through with phone left empty", () => {
    const form = renderForm();
    expect(submitValid(form).defaultPrevented).toBe(false);
  });

  it("shows the submit button as loading after a valid submit", () => {
    const form = renderForm();
    submitValid(form);

    const button = form.querySelector("button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain("Submitting…");
    expect(button.querySelector(".p-icon--spinner")).not.toBeNull();
  });

  it("clears a field's error once it is fixed", () => {
    submitForm(renderForm());

    type("firstName", "Ada");

    expect(wrapper("firstName").classList).not.toContain("is-error");
    expect(
      wrapper("firstName").querySelector(".js-validation-message"),
    ).toBeNull();
    expect(wrapper("email").classList).toContain("is-error");
  });

  it("makes the submit button usable again after coming back with Back", () => {
    const form = renderForm();
    submitValid(form);

    const button = form.querySelector("button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    window.dispatchEvent(
      Object.assign(new Event("pageshow"), { persisted: true }),
    );

    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe("Submit");
    expect(button.querySelector(".p-icon--spinner")).toBeNull();
  });

  it("keeps the error while the field is still invalid", () => {
    submitForm(renderForm());

    type("email", "not-an-email");

    expect(wrapper("email").classList).toContain("is-error");
  });

  it("links the error message to its field for screen readers", () => {
    submitForm(renderForm());
    const field = document.getElementById("firstName") as HTMLInputElement;
    const messageId = field.getAttribute("aria-describedby");

    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(messageId as string)?.textContent).toBe(
      field.validationMessage,
    );

    type("firstName", "Ada");

    expect(field.hasAttribute("aria-invalid")).toBe(false);
    expect(field.hasAttribute("aria-describedby")).toBe(false);
  });
});
