import { trackEvent } from "@canonical/analytics-events";
import { clearResultHash, handleSubmitResult } from "../result";

vi.mock("@canonical/analytics-events", () => ({ trackEvent: vi.fn() }));

const ANSWERS_KEY = "contact-form-answers";
const TRACKING_KEY = "contact-form-tracking";

function visit(path: string) {
  window.history.replaceState({}, "", path);
  const redirecting = handleSubmitResult();
  clearResultHash();
  return redirecting;
}

describe("Submit result", () => {
  beforeEach(() => {
    window.sessionStorage.setItem(ANSWERS_KEY, '{"firstName":"Test"}');
    window.sessionStorage.setItem(TRACKING_KEY, '{"utm_source":"google"}');
    vi.mocked(trackEvent).mockClear();
    document.body.innerHTML = `
      <form class="js-contact-form">
        <div class="js-contact-error" hidden></div>
        <input name="firstName">
      </form>
    `;
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  const firstName = () =>
    (document.querySelector('[name="firstName"]') as HTMLInputElement).value;
  const errorShown = () =>
    !(document.querySelector(".js-contact-error") as HTMLElement).hidden;

  it("clears saved answers and tracking after a successful send", () => {
    visit("/about/thank-you#contact-form-success");

    expect(window.sessionStorage.getItem(ANSWERS_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(TRACKING_KEY)).toBeNull();
    expect(trackEvent).toHaveBeenCalledWith("contact_form_success");
  });

  it("records a pop-up success once and removes the hash", () => {
    visit("/node-red?channel=stable#contact-form-success");

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(window.location.pathname + window.location.search).toBe(
      "/node-red?channel=stable",
    );
    expect(window.location.hash).toBe("");

    // A refresh no longer repeats the result
    handleSubmitResult();
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("clears saved answers on the thank-you page without counting a send", () => {
    visit("/about/thank-you");

    expect(window.sessionStorage.getItem(ANSWERS_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(TRACKING_KEY)).toBeNull();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("shows the error above the refilled form after a failed send", () => {
    expect(visit("/about/contact-us#contact-form-fail")).toBe(false);

    expect(errorShown()).toBe(true);
    expect(firstName()).toBe("Test");
    expect(trackEvent).toHaveBeenCalledWith("contact_form_failed");
    expect(window.location.hash).toBe("");
  });

  it("starts empty when the contact page is opened normally", () => {
    visit("/about/contact-us");

    expect(errorShown()).toBe(false);
    expect(firstName()).toBe("");
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("leaves other hashes alone", () => {
    visit("/node-red#readme");

    expect(window.location.hash).toBe("#readme");
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
