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
