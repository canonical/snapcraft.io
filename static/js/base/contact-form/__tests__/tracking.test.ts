import {
  captureLanding,
  clearTracking,
  currentURLWithoutTracking,
  fillTrackingFields,
} from "../tracking";

const FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "GCLID__c",
  "Facebook_Click_ID__c",
];
const EMPTY = Object.fromEntries(FIELDS.map((name) => [name, ""]));

function renderForm() {
  document.body.innerHTML = `
    <form>
      ${FIELDS.map((name) => `<input type="hidden" name="${name}" value="">`).join("")}
    </form>
  `;
  return document.querySelector("form") as HTMLFormElement;
}

function visit(path: string) {
  window.history.replaceState({}, "", path);
  captureLanding();
}

function sent(form: HTMLFormElement) {
  return Object.fromEntries(
    FIELDS.map((name) => [
      name,
      (form.elements.namedItem(name) as HTMLInputElement).value,
    ]),
  );
}

describe("Campaign tracking fields", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    document.cookie = "_cookies_accepted=all";
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fills only the UTMs present in the landing link", () => {
    visit("/?utm_source=google&utm_campaign=spring");
    const form = renderForm();
    fillTrackingFields(form);

    expect(sent(form)).toEqual({
      ...EMPTY,
      utm_source: "google",
      utm_campaign: "spring",
    });
  });

  it("leaves the fields empty when the landing link has none", () => {
    visit("/postgresql");
    const form = renderForm();
    fillTrackingFields(form);

    expect(sent(form)).toEqual(EMPTY);
  });

  it("keeps UTMs and click IDs after moving to another page", () => {
    visit("/postgresql?utm_source=google&gclid=abc&fbclid=xyz");
    visit("/mysql");
    const form = renderForm();
    fillTrackingFields(form);

    expect(sent(form)).toMatchObject({
      utm_source: "google",
      GCLID__c: "abc",
      Facebook_Click_ID__c: "xyz",
    });
  });

  it("fills nothing once tracking is cleared", () => {
    visit("/?utm_source=google&gclid=abc");
    clearTracking();
    const form = renderForm();
    fillTrackingFields(form);

    expect(sent(form)).toEqual(EMPTY);
  });

  it("continues when the browser blocks access to session storage", () => {
    const error = new DOMException("Storage blocked", "SecurityError");
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw error;
    });
    const form = renderForm();

    expect(() => visit("/?utm_source=google&gclid=abc")).not.toThrow();
    expect(() => fillTrackingFields(form)).not.toThrow();
    expect(sent(form)).toEqual(EMPTY);
    expect(() => clearTracking()).not.toThrow();
    expect(console.warn).toHaveBeenCalledTimes(3);
  });

  it("continues when saving tracking exceeds the storage quota", () => {
    const error = new DOMException("Storage full", "QuotaExceededError");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw error;
    });

    expect(() => visit("/?utm_source=google")).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to save contact form tracking",
      error,
    );
  });
});

describe("Tracking in URLs", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it.each([
    ["essential", "/?q=postgresql"],
    ["all", "/?q=postgresql&utm_source=qa&gclid=g1&fbclid=f1"],
  ])("with cookies %s returns %s", (consent, expected) => {
    document.cookie = `_cookies_accepted=${consent}`;
    window.history.replaceState(
      {},
      "",
      "/?q=postgresql&utm_source=qa&gclid=g1&fbclid=f1",
    );

    expect(currentURLWithoutTracking().search).toBe(expected.slice(1));
  });

  it("does not fill acquisition_url", () => {
    document.cookie = "_cookies_accepted=all";
    document.body.innerHTML = `<form><input type="hidden" name="acquisition_url" value=""></form>`;
    const form = document.querySelector("form") as HTMLFormElement;

    fillTrackingFields(form);

    expect(
      (form.elements.namedItem("acquisition_url") as HTMLInputElement).value,
    ).toBe("");
  });
});
