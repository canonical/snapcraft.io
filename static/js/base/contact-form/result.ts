import { clearAnswers } from "./saved-answers";
import { clearTracking, trackFormEvent } from "./tracking";

export function contactFormSucceeded(): void {
  clearAnswers();
  clearTracking();
  trackFormEvent("contact_form_success");
}

export function contactFormFailed(): void {
  trackFormEvent("contact_form_failed");
}
