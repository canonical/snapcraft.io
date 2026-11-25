import { contactFormFailed, contactFormSucceeded } from "./result";
import { restoreAnswers } from "./saved-answers";

// Handles the result when ubuntu.com returns from a /about/contact-us send
export function setupFullPageResult(): void {
  const { pathname, hash } = window.location;

  if (pathname === "/about/thank-you") {
    if (hash === "#contact-form-fail") {
      // ubuntu.com always returns to the thank-you page, so send failures back to the form
      window.location.replace("/about/contact-us#contact-form-fail");
    } else if (hash === "#contact-form-success") {
      contactFormSucceeded();
    }
  }

  // Show the error above the form, refilled with the previous answers
  if (pathname === "/about/contact-us" && hash === "#contact-form-fail") {
    const form = document.querySelector<HTMLFormElement>(".js-contact-form");
    if (form) restoreAnswers(form);
    const error = document.querySelector<HTMLElement>(".js-contact-error");
    if (error) error.hidden = false;
    contactFormFailed();
  }
}
