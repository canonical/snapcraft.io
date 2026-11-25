import { trackEvent } from "@canonical/analytics-events";
import { setupFullPageResult } from "../full-page";

vi.mock("@canonical/analytics-events", () => ({ trackEvent: vi.fn() }));

const ANSWERS_KEY = "contact-form-answers";
const TRACKING_KEY = "contact-form-tracking";

function visit(path: string) {
  window.history.replaceState({}, "", path);
  setupFullPageResult();
}

describe("Full page result", () => {
  beforeEach(() => {
    window.sessionStorage.setItem(ANSWERS_KEY, '{"firstName":"Test"}');
    window.sessionStorage.setItem(TRACKING_KEY, '{"utm_source":"google"}');
    vi.mocked(trackEvent).mockClear();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("clears saved answers and tracking after a successful send", () => {
    visit("/about/thank-you#contact-form-success");

    expect(window.sessionStorage.getItem(ANSWERS_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(TRACKING_KEY)).toBeNull();
    expect(trackEvent).toHaveBeenCalledWith("contact_form_success");
  });

  it("keeps saved answers when the thank-you page is opened directly", () => {
    visit("/about/thank-you");

    expect(window.sessionStorage.getItem(ANSWERS_KEY)).not.toBeNull();
    expect(window.sessionStorage.getItem(TRACKING_KEY)).not.toBeNull();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  function renderContactPage() {
    document.body.innerHTML = `
      <div class="js-contact-error" hidden></div>
      <form class="js-contact-form"><input name="firstName"></form>
    `;
  }

  const firstName = () =>
    (document.querySelector('[name="firstName"]') as HTMLInputElement).value;
  const errorShown = () =>
    !(document.querySelector(".js-contact-error") as HTMLElement).hidden;

  it("shows the error above the refilled form after a failed send", () => {
    renderContactPage();
    visit("/about/contact-us#contact-form-fail");

    expect(errorShown()).toBe(true);
    expect(firstName()).toBe("Test");
    expect(trackEvent).toHaveBeenCalledWith("contact_form_failed");
  });

  it("starts empty when the contact page is opened normally", () => {
    renderContactPage();
    visit("/about/contact-us");

    expect(errorShown()).toBe(false);
    expect(firstName()).toBe("");
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
