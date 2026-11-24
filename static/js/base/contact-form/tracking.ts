const STORAGE_KEY = "contact-form-tracking";
const ACCEPTED = ["functionality", "performance", "all"];
const PARAMS: Record<string, string> = {
  utm_source: "utm_source",
  utm_medium: "utm_medium",
  utm_campaign: "utm_campaign",
  utm_content: "utm_content",
  utm_term: "utm_term",
  gclid: "GCLID__c",
  fbclid: "Facebook_Click_ID__c",
};

type ContactFormEvent =
  | "contact_form_opened"
  | "contact_form_submitted"
  | "contact_form_success"
  | "contact_form_failed";
type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

export function pushEvent(event: ContactFormEvent): void {
  const analyticsWindow = window as DataLayerWindow;
  analyticsWindow.dataLayer ||= [];
  analyticsWindow.dataLayer.push({ event });
}

function getCookie(name: string): string {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
}

function readSaved(): Record<string, string> {
  try {
    const saved = JSON.parse(
      window.sessionStorage.getItem(STORAGE_KEY) || "{}",
    );
    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    console.warn("Failed to read contact form tracking", error);
    return {};
  }
}

export function captureLanding(): void {
  const params = new URLSearchParams(window.location.search);
  const found: Record<string, string> = {};
  Object.entries(PARAMS).forEach(([param, field]) => {
    const value = params.get(param);
    if (value) found[field] = value;
  });
  if (Object.keys(found).length) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    } catch (error) {
      console.warn("Failed to save contact form tracking", error);
    }
  }
}

export function fillTrackingFields(form: HTMLFormElement): void {
  const consent = getCookie("_cookies_accepted");
  const saved = hasTrackingConsent() ? readSaved() : {};

  const setField = (name: string, value: string) => {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement) field.value = value;
  };

  Object.values(PARAMS).forEach((field) => setField(field, saved[field] || ""));
  setField("_cookies_accepted", consent);
  setField("preferredLanguage", navigator.language || "");

  const pageURL = currentURLWithoutTracking();
  pageURL.hash = "";
  setField("acquisition_url", pageURL.href);
}

function hasTrackingConsent(): boolean {
  return ACCEPTED.includes(getCookie("_cookies_accepted"));
}

// Without consent, UTMs and click IDs must not leak through page URLs either
export function currentURLWithoutTracking(): URL {
  const url = new URL(window.location.href);
  if (!hasTrackingConsent()) {
    Object.keys(PARAMS).forEach((param) => url.searchParams.delete(param));
  }
  return url;
}

export function clearTracking(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to remove contact form tracking", error);
  }
}
