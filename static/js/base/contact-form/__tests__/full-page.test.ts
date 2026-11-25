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

  it("reports a failed send on the error page and keeps saved answers", () => {
    visit("/about/contact-us/error#contact-form-fail");

    expect(trackEvent).toHaveBeenCalledWith("contact_form_failed");
    expect(window.sessionStorage.getItem(ANSWERS_KEY)).not.toBeNull();
  });
});
